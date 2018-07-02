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

        // Initially service is not running
        this.running = false;

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
            .on("error", err => {
                // Root error handler. Logs all errors
                logger.error(`HTTPService: ${err}`);
                logger.debug(`HTTPService: ${err.stack}`);
            });
    }

    // Starts the service
    start() {
        logger.debug("HTTPService: Start function called");

        return new Promise((resolve, reject) => {
            // Start service only if it isn't running
            // Note that calling start for the 2nd time before the listen
            // event's callback is called will result in an error. We should
            // wait for the returned Promise to resolve for proper
            // behaviour.
            if (!this.running) {
                this.server.listen(this.port, () => {
                    let addr = this.server.address();
                    // Service has started once socket is listening
                    this.running = true;
                    logger.info(
                        `HTTPService: listening on ${addr.address}:${addr.port}`
                    );
                    resolve(true);
                });

                // We register a one time error listener in case listen faces an
                // error. In case of successful listen the listner might
                // be called for some other error event. But our promise
                // is already resolved so it doesn't matter.
                this.server.once("error", err => {
                    // Error is logged by root handler
                    reject(err);
                });
            } else {
                // If service was already running return false
                resolve(false);
            }
        });
    }

    // Stops the service
    stop() {
        logger.debug("HTTPService: Stop function called");

        return new Promise((resolve, reject) => {
            // Note that calling stop for the 2nd time before the first call's
            // Promise is resolved will lead to an error. We should wait for the
            // first promise to resolve.
            if (this.running) {
                this.server.close(() => {
                    logger.info("HTTPService: Service stopped");
                    this.running = false;
                    resolve(true);
                });

                // We register one time error handler to catch any errors
                // that might occur when closing the server.
                this.server.once("error", () => {
                    // Error is logged by root handler
                    reject(false);
                });
            } else {
                // If server was already stopped
                resolve(false);
            }
        });
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
        this.metaData.getDataFromId(req.path[0]).then(data => {
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
        let data = await this.metaData.getDataFromId(req.path[0]);
        let path = data.path;

        // If directory return directory listing
        if (data.type === "dir") {
            let children = await readdir(path);
            children = children.map(child => Path.join(path, child));
            // Filter out ignored files from children. This reduces number of
            // misses in db. i.e. number of negatives for getDataFromPath
            children = children.filter(
                child => !this.ignore.some(re => re.test(child))
            );

            // Get list of children
            let listing = [];
            // Get list of data for children
            // Each data fetch returns a Promise. We collect all these
            // promises in an array and then wait for all of them to
            // resolve
            let chdataList = await Promise.all(
                children.map(child =>
                    this.metaData.getDataFromPath(child).catch(() => {
                        // In case the key doesn't exist, error is thrown.
                        // We return null to avoid an error being thrown.
                        return null;
                    })
                )
            );
            // Filter the response that should be sent. i.e. add only those
            // properties to elements of listing that should be sent
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

        // For both range requests and normal requests we return before we have
        // completed serving the entire file. I don't think that it should
        // cause any problems but it's worth noting.
        if (req.headers.range) {
            // Serving range requests helps stream videos on browsers using
            // inbuilt controls.

            // Calculate range of data to serve
            let range = req.headers.range;
            let parts = range.replace(/bytes=/, "").split("-");
            let start = parseInt(parts[0], 10);
            let end = parts[1] ? parseInt(parts[1], 10) : data.size - 1;
            let chunksize = end - start + 1;

            // Open read stream containing only the required chunk
            let fileStream = Fs.createReadStream(path, { start, end });

            res.writeHead(206, {
                "Content-Range": `bytes ${start}-${end}/${data.size}`,
                "Accept-Ranges": "bytes",
                "Content-Length": `${chunksize}`,
                "Content-Type": Mime.lookup(path) || "application/octet-stream"
            });
            // Pipe the file stream to res to serve the file data
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
                // But we have to ensure that downInc has been resolved
                downUpdate = downUpdate.then(() =>
                    this.metaData.updateDownload(path, -1)
                );
            });

            // Serve entire file if no range specified
            // If range was specified then previous if block would have been
            // run
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
    validateRequest(req) {
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

        return this.metaData
            .getDataFromId(req.path[0])
            .then(({ path: reqPath }) => {
                // If promise is not rejected then path exists.
                // If it matches ignore patterns then it should not be served.
                let hiddenFile = this.ignore.some(re => re.test(reqPath));
                // Check if path is descendent of any shared directory.
                // This is just an extra check to ensure file is not served in
                // case meta data has extra paths.
                let isShared = isChild(reqPath, this.share);

                if (hiddenFile || !isShared) {
                    // If hidden or not shared then throw error
                    throw Error("Resource can't be shared");
                }
            })
            .catch(err => {
                logger.debug(`HTTPService.validateRequest: ${err}`);
                logger.debug(`HTTPService.validateRequest: ${err.stack}`);

                // If id doesn't exist in db or it can't be shared then control
                // reaches here
                let x = new Error("Resource not found");
                x.code = 404;
                // Reject returned promise so that rootHandler can handle response
                // properly
                throw x;
            });
    }
}
