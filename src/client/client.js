// Client makes the request

import Dgram from "dgram";
import * as Fs from "fs";
import Winston from "winston";
import * as Util from "util";
import { get as http } from "http";
import { URL } from "url";
import * as Path from "path";

import {
    DEFAULT_CLIENT as DEFAULT,
    DEFAULT_UDP_PORT,
    DEFAULT_NETWORK,
    DEFAULT_HTTP_PORT
} from "../utils/constants";

const logger = Winston.loggers.get("client");
const fstat = Util.promisify(Fs.stat);
const fsaccess = Util.promisify(Fs.access);

// Function that actually downloads file served at url to given path. No check
// performed for path or callback to make it efficient. Error if path already
// exists.
// All check done by Client member functions.
// Params:
//  - url: URL at which file is served. "http://" is prefixed to given URL.
//  - path: Path to which file should be saved. Can be directory or file path.
//  - pathIsDir: True if path is a directory. In this case the name is set from
//  response header.
//  - callback: callback is sent bytes downloaded, file size and path as
//  arguments
function _download(url, path, pathIsDir, callback) {
    return new Promise((resolve, reject) => {
        url = `http://${url}`;

        let req = http(url);
        req
            .on("error", err => {
                // On request error
                reject(err);
            })
            .on("response", res => {
                if (pathIsDir) {
                    let fileName = res.headers["content-disposition"];
                    // Extract filename from header. Assumption is that the
                    // header is exactly as returned by the http service.
                    // Might throw errors for other headers
                    fileName = fileName.replace(`inline; filename="`, "");
                    // Remove trailing double quote
                    fileName = fileName.slice(0, fileName.length - 1);

                    path = Path.join(path, fileName);
                }

                let fileSize = parseInt(res.headers["content-length"], 10);
                let bytesDownloaded = 0;

                // Do no overwrite existing file
                let downloadedFile = Fs.createWriteStream(path, {
                    flags: "wx"
                });

                // If file exists or some unexpected error
                downloadedFile
                    .on("error", err => {
                        // Abort HTTP request and unpipe response
                        req.abort();
                        res.unpipe(downloadedFile);
                        if (err.code === "EEXIST")
                            reject(`${path} already exsits`);
                        else reject(err);
                    })
                    .on("open", err => {
                        // add event handlers to res only after file has been
                        // successfully opened. This ensures that callback is
                        // called only if writeStream opened successfully
                        res.on("data", chunk => {
                            bytesDownloaded += chunk.length;
                            callback(bytesDownloaded, fileSize, path);
                        });
                    })
                    .on("finish", () => {
                        resolve(path);
                    });

                // Pipe data
                res.pipe(downloadedFile);
            });
    });
}

export default class Client {
    // Params:
    //  An object consisting of the following options:
    //   - port: The port to which the client should bind to.
    //   - udpPort: The port of UDP server to which requests should be sent
    //   - httpPort: The port of the HTTP server for making requests
    //   - network [optional]: The network to which requests should
    //   belong. Default is "Media_Hub".
    //   - broadcastIp [optional]: The IP address to which broadcasts will
    //   be made. Default value is "255.255.255.255".
    //   - timeout [optional]: The time to listen for responses to udp
    //   requests. Default value is 3 seconds
    //   - incoming [optional]: The default incoming directory for files. If
    //   not given path must be provided when downloading.
    constructor({
        clientPort: port = DEFAULT.port,
        udpPort = DEFAULT_UDP_PORT,
        httpPort = DEFAULT_HTTP_PORT,
        network = DEFAULT_NETWORK,
        broadcastIp = DEFAULT.broadcastIp,
        timeout = DEFAULT.timeout,
        incoming
    }) {
        if (incoming) {
            try {
                // check if incoming is valid directory
                let incomingStat = Fs.statSync(incoming);
                if (!incomingStat.isDirectory()) {
                    throw Error(
                        "Client: Incoming is not a directory. It will be ignored"
                    );
                }
            } catch (err) {
                logger.debug(`Client: ${err}`);
                incoming = null;
            }
        }

        this.port = port;
        this.udpPort = udpPort;
        this.httpPort = httpPort;
        this.network = network;
        this.broadcastIp = broadcastIp;
        this.timeout = timeout;
        this.incoming = incoming;
    }

    // Broadcast search request
    // Params:
    //  - searchString: The string to search for
    //  - param [optional]: Search for name or tag. Empty implies no data
    //  will be sent to server.
    //
    //  Return Value:
    //   A Promise that is resolved to the results of the search
    search(searchString, param) {
        return new Promise((resolve, reject) => {
            if (typeof searchString !== "string") {
                logger.debug(
                    `Client.search: searchString is of type ${typeof searchString}`
                );
                reject("searchString should be of type string");
            }

            let request = {
                network: this.network,
                search: searchString,
                param: param || "default"
            };

            let requestString = JSON.stringify(request, null, 0);

            // Accumulate results from all responses in array
            let resultAcc = [];

            // Create UDP4 socket with reuseAddr
            // Socket is created for every search request for lack of better
            // alternative
            let socket = Dgram.createSocket("udp4", true);
            // Add event listeners to handle response
            socket
                .on("error", err => {
                    logger.error(`Client.search: ${err}`);
                    logger.debug(`Client.search: ${err.stack}`);

                    // Rejected if socket error occurs. Mainly if address is
                    // already used
                    reject(err);
                })
                .on("message", (mssg, rinf) => {
                    try {
                        let response = JSON.parse(mssg);
                        if (
                            response.network === request.network &&
                            response.search === request.search &&
                            response.param === request.param
                        ) {
                            let url = `${rinf.address}:${this.httpPort}`;

                            // Add results to responseAcc
                            response.results.forEach(result => {
                                resultAcc.push({
                                    name: result[0],
                                    url: `${url}/${result[1]}`
                                });
                            });
                        }
                    } catch (err) {
                        logger.debug(`Client.search.socketMessage: ${err}`);
                    }
                })
                .on("close", () => {
                    logger.debug("Client.search: Search socket closed");

                    // Resolve promise to result
                    resolve(resultAcc);
                });

            socket.bind(this.port, () => {
                // Set broadcast
                socket.setBroadcast(true);

                let addr = socket.address();
                logger.debug(
                    `Client.search: search request for ${request.search}:${
                        request.param
                    } sent via ${addr.address}:${addr.port}`
                );

                // Send request via socket
                socket.send(requestString, this.udpPort, this.broadcastIp);

                // Add timeout for listening to responses
                setTimeout(() => {
                    logger.debug(
                        `Client.search: ${
                            this.timeout
                        } elapsed since search request. Timeout for response.`
                    );
                    socket.close();
                }, this.timeout);
            });
        });
    }

    // Download file
    // Params:
    //  - url: URL of file or directory to be downloaded.
    //  - path [optional]: Path to save file. Can be name of file or directory. If not
    //  given will be saved to incoming.
    //  - callback [optional]: Called when progress is updated. The bytes
    //  downloaded, file size and path where file is downloaded will be passed
    //  as arguments.
    async downloadFile(url, path, callback) {
        let pathIsDir = false;

        // If path is passed check validity. After the if block if path or it's
        // parent directory is valid then it is not falsy
        if (path) {
            try {
                let stat = await fstat(path);

                // if path is directory we are done
                if (stat.isDirectory()) {
                    pathIsDir = true;
                } else if (stat.isFile()) {
                    // If a file exists at path then thow Error
                    throw Error(`File exists at ${path}`);
                }
            } catch (err) {
                try {
                    // path does not exist. Maybe it's the final path of the
                    // new file.  Check if parent directory exists.
                    if (err.code === "ENOENT") {
                        // Promise is rejected if parent directory doesn't exist
                        let stat = await fstat(Path.dirname(path));

                        // if parent directory exists then ok
                        if (!stat.isDirectory()) {
                            throw Error("Invalid path passed");
                        }
                    } else {
                        // If error is not ENOENT then rethrow
                        throw err;
                    }
                } catch (err) {
                    logger.debug(`Client.downloadFile: ${err}`);
                    // If parent directory does not exist, or if stat for path
                    // throws an error other than ENOENT then assign path to
                    // falsy value
                    path = null;
                }
            }
        }

        // If path is falsy then try incoming
        if (!path) {
            path = this.incoming;
            pathIsDir = true;
        }

        // If callback is not function, ignore silently
        if (typeof callback !== "function") {
            logger.debug(
                `Client.downloadFile: callback is of type ${typeof callback}. Ignoring callback.`
            );
            // assign callback to empty function
            callback = () => {};
        }

        // If path is falsy then incoming nor path passed is valid
        if (!path) {
            logger.debug(
                "Client.downloadFile: No valid incoming or path given."
            );
            throw Error("No valid incoming or path given.");
        }
        if (!url) {
            logger.debug("Client.downloadFile: URL not given.");
            throw Error("URL not given.");
        }

        try {
            // Now path has been set
            // Make request
            return await _download(url, path, pathIsDir, callback);
        } catch (err) {
            logger.debug(`Client.downloadFile: ${err}`);
            throw err;
        }
    }
}
