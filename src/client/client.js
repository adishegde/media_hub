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
                    logger.debug(
                        "Client: Incoming is not a directory. It will be ignored"
                    );
                    incoming = null;
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
    //  downloaded and file size will be passed as argument.
    async downloadFile(url, path, callback) {
        // If path is falsy then try incoming
        path = path || this.incoming;

        // If callback is not function, ignore silently
        if (typeof callback !== "function") {
            logger.debug(
                `Client.downloadFile: callback is of type ${typeof callbac}. Ignoring callback.`
            );
            // assign callback to empty function
            callback = () => {};
        }

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

        let pathIsDir = false;

        try {
            // If path is directory
            let stat = await fstat(path);

            // if path is directory we are done
            if (stat.isDirectory()) {
                pathIsDir = true;
            }
        } catch (err) {
            try {
                // path does not exist. Maybe it's the final path of the new file.
                // Check if parent directory exists.
                if (err.code === "ENOENT") {
                    // Promise is rejected if parent directory doesn't exist
                    stat = await fstat(Path.dirname(path));

                    // if parent directory exists then ok else throw Error
                    if (!stat.isDirectory()) {
                        logger.debug(
                            "Client.downloadFile: Invalid path passed"
                        );
                        throw Error("Invalid path passed");
                    }
                } else {
                    // If error is not ENOENT then rethrow
                    logger.debug(`Client.downloadFile: ${err}`);
                    throw err;
                }
            } catch (err) {
                // In case of any error try and set path to incoming
                if (!this.incoming) {
                    // If incoming is throw Error
                    throw Error("No valid incoming nor path passed.");
                }
                path = this.incoming;
                pathIsDir = true;
            }
        }

        try {
            // Now path has been set
            // Make request
            return new Promise((resolve, reject) => {
                http(`http://${url}`, res => {
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

                    callback(bytesDownloaded, fileSize);

                    // If permission error occurs, error will be thrown here
                    let downloadedFile = Fs.createWriteStream(path);
                    // Write data
                    res.pipe(downloadedFile);

                    // Increase bytes downloaded for every chunk
                    res.on("data", chunk => {
                        bytesDownloaded += chunk.length;
                        callback(bytesDownloaded, fileSize);
                    });

                    res.on("end", () => {
                        // Resolve promise if download is completed
                        resolve(path);
                    });
                    res.on("error", err => {
                        logger.debug(`Client.downloadFile: ${err}`);
                        reject(err);
                    });
                });
            });
        } catch (err) {
            logger.debug(`Client.downloadFile: ${err}`);
            throw err;
        }
    }
}
