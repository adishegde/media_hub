// HTTP service serves file meta data and the file itself
import Http from "http";
import { URL } from "url";
import * as Fs from "fs";
import * as Util from "util";
import * as Path from "path";
import Winston from "winston";
import Mime from "mime-types";

import {
    DEFAULT_HTTP_PORT,
    DEFAULT_SERVER as DEFAULT
} from "../../utils/constants";
import { isChild } from "../../utils/functions";

const logger = Winston.loggers.get("daemon");

const readdir = Util.promisify(Fs.readdir);

export default class HTTPService {
    // Params:
    //  - metaData: An object of class MetaData.
    //  - A config object of having properties:
    //    - port [optional]: Port on which HTTP service should run
    //    - share: List of shared directories.
    constructor(
        metaData,
        { httpPort: port = DEFAULT_HTTP_PORT, share, ignore = DEFAULT.ignore }
    ) {
        if (!metaData) {
            logger.error("MetaData object not passed to HTTPService.");
            throw Error("MetaData object not passed to HTTPService.");
        }
        if (!share) {
            logger.error("HTTPService: share not passed.");
            throw Error("Share not passed to HTTPService.");
        }
        if (!Array.isArray(ignore)) {
            logger.error(
                `HTTPService: ignore is not an array. It's value is ${ignore}`
            );
            throw Error("Ignore is not an array");
        }

        this.metaData = metaData;
        this.port = port;
        this.share = share;
        this.ignore = ignore.map(exp => new RegExp(exp));

        this.server = Http.createServer(this.rootHandler.bind(this));
        this.server
            .on("clientError", (err, socket) => {
                logger.info(`HTTPService: clientError`);
                logger.debug(`HTTPService: ${err.stack}`);

                socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
            })
            .on("listening", () => {
                let addr = this.server.address();
                logger.info(
                    `HTTPService: listening on ${addr.address}:${addr.port}`
                );
            })
            .on("error", err => {
                logger.error(`HTTPService: ${err}`);
                logger.debug(`HTTPService: ${err.stack}`);
            })
            .on("close", () => {
                logger.info("HTTPService: Service stopped");
            });
    }

    // Starts the service
    start() {
        logger.debug("HTTPService: Start function called");
        this.server.listen(this.port);
    }

    // Stops the service
    stop() {
        logger.debug("HTTPService: Stop function called");
        this.server.close();
    }

    // Handles all incoming requests
    async rootHandler(req, res) {
        try {
            let addr = req.socket.address();
            logger.info(
                `HTTPService: Request at ${req.url} from ${addr.address}:${
                    addr.port
                }`
            );
            await this.validateRequest(req);

            // If request is for meta data pass request to metaDataHandler
            // The request handlers may be async so use await to catch errors
            if (req.path.length === 2) {
                await this.metaDataRequestHandler(req, res);
            } else {
                // Else serve file
                await this.fileRequestHandler(req, res);
            }
        } catch (err) {
            if (err.code === 404) {
                logger.debug(`HTTPService: ${err}`);
                res.writeHead(404, err.toString());
            } else {
                logger.error(`HTTPService: ${err}`);
                logger.debug(`HTTPService: ${err.stack}`);
                res.writeHead(500);
            }
            res.end();
        }
    }

    // Serves metaData of file
    metaDataRequestHandler(req, res) {
        this.metaData
            .getPathFromId(req.path[0])
            .then(path => {
                return this.metaData.getData(path);
            })
            .then(data => {
                // Create new object
                data = { ...data };
                // Don't send path in response
                delete data.path;
                data = JSON.stringify(data, null, 0);

                res.writeHead(200, {
                    "Content-Type": "application/json"
                });
                res.write(data);
                res.end();
            });
    }

    // Serves the file
    async fileRequestHandler(req, res) {
        let data = await this.metaData.getData(
            await this.metaData.getPathFromId(req.path[0])
        );
        let path = data.path;

        // If directory return directory listing
        if (data.type === "dir") {
            // Returning promise here
            // Promises are used because of async readdir operation
            let children = await readdir(path);
            children = children.map(child => Path.join(path, child));

            // Get list of children
            let listing = [];
            let chdataList = await Promise.all(
                children.map(child =>
                    this.metaData.hasFile(child).then(exists => {
                        if (exists) return this.metaData.getData(child);
                        return null;
                    })
                )
            );
            chdataList.forEach(chdata => {
                if (chdata)
                    listing.push({
                        name: chdata.name,
                        id: chdata.id,
                        type: chdata.type
                    });
            });

            let response = {
                id: req.path[0],
                name: data.name,
                size: data.size,
                children: listing
            };
            response = JSON.stringify(response, null, 0);

            res.writeHead(200, {
                "Content-Type": "application/json"
            });
            res.write(response);
            res.end();

            // Done with directory response
            return;
        }

        if (req.headers.range) {
            // Calculate range of data to serve
            let range = req.headers.range;
            let parts = range.replace(/bytes=/, "").split("-");
            let start = parseInt(parts[0], 10);
            let end = parts[1] ? parseInt(parts[1], 10) : data.size - 1;
            let chunksize = end - start + 1;

            let fileStream = Fs.createReadStream(path, { start, end });

            res.writeHead(206, {
                "Content-Range": `bytes ${start}-${end}/${data.size}`,
                "Accept-Ranges": "bytes",
                "Content-Length": `${chunksize}`,
                "Content-Type": Mime.lookup(path) || "application/octet-stream"
            });
            fileStream.pipe(res);
        } else {
            // Increment download
            let downUpdate = this.metaData.updateDownload(path);

            // If request is for entire file and request is aborted, download is
            // not incremented.
            req.on("aborted", () => {
                logger.debug(
                    `HTTPService.fileRequestHandler: ${path} requested aborted.`
                );
                // Decrement download. No change since it was incremented before
                // But we have to ensure that downUpdate has been resolved
                downUpdate.then(() => this.metaData.updateDownload(path, -1));
            });

            // Serve entire file if no range specified
            res.writeHead(200, {
                "Content-Type": Mime.lookup(path) || "application/octet-stream",
                "Content-Length": `${data.size}`,
                "Content-Disposition": `inline; filename="${data.name}"`
            });

            let fileStream = Fs.createReadStream(path);
            fileStream.pipe(res);
        }
    }

    // Validates URL
    // Only URL of type `/:fileId` or `/:fileId/meta` where fileId exists in
    // metaData is allowed. Else error is thrown by function.
    // It also pareses URL and assigns the JS object to req.url. It also adds
    // a path property which is an array of resources in the URL.
    async validateRequest(req) {
        let path = req.url;
        // Remove initial '/' char
        path = path.slice(1);
        if (path.endsWith("/")) path = path.slice(0, path.length - 1);
        req.path = path.split("/");

        if (
            req.path.length > 2 ||
            (req.path.length === 2 && req.path[1] !== "meta")
        ) {
            let x = new Error("Invalid URL");
            x.code = 404;
            throw x;
        }

        let reqPath = await this.metaData.getPathFromId(req.path[0]);

        // Check if reqPath matches any ignore patterns. If it does, it should
        // not be served.
        let hiddenFile = this.ignore.some(re => re.test(reqPath));

        // Check if file with id exists in db
        // If it exists then check if path is descendent of any shared
        // directory. If not then throw error. This is just an extra check to
        // ensure file is not served in case meta data has extra paths.
        if (!reqPath || !isChild(reqPath, this.share) || hiddenFile) {
            let x = new Error("Resource not found");
            x.code = 404;
            throw x;
        }
    }
}
