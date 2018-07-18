/* Extends the core client to support HTTP requests */
import { get as http } from "http";
import { remote } from "electron";
import * as Path from "path";

import ClientCore from "core/client/client";
import FileDownloader, { events } from "./fileDownloader";
import { addLogFile } from "core/utils/log";
import { CLIENT_LOG } from "app/utils/constants";

const config = remote.getGlobal("config");
const app = remote.app;

// Add log file for client logger here so that we can use Client instance
// without explicitly adding log files everytime.
addLogFile("client", Path.join(app.getPath("userData"), CLIENT_LOG), "debug");

// No point in doing a lot of checks on URL like in the case of cli since the
// app is responsible for URL. Thus as long as data is managed correctly by the
// app no unexpected errors should occur.
class Client extends ClientCore {
    constructor(config) {
        // Setup options by calling core client constructor
        super(config);

        // Maintains a mapping between file ids and their download items
        this.downloads = {};

        // NOTE: Incoming path is not checked.
        this.incoming = config.incoming;
    }

    // Fetches meta data of file at URL
    getMeta(url) {
        if (!url) {
            return Promise.reject("URL not passed.");
        }

        // We'll need to access req later in the Promise chain, so we maintain
        // a external reference
        let req;
        // URL for meta data
        let metaUrl = `${url}/meta`;
        return new Promise((resolve, reject) => {
            // res is IncomingMessage while req is ClientRequest
            req = http(metaUrl, res => {
                let data = "";

                if (res.statusCode !== 200) {
                    reject(
                        `Server responded with ${res.statusCode}: ${
                            res.statusMessage
                        }`
                    );
                }

                if (res.headers["content-type"] !== "application/json")
                    reject(`${metaUrl} does not correspond to meta data`);

                res.on("data", chunk => {
                    data += chunk;
                }).on("end", () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (err) {
                        reject("Corrupted response");
                    }
                });
            }).on("error", err => {
                // Error on request object, returned by http
                reject("Error connecting to server.");
            });
        }).catch(err => {
            // If previous promise is rejected then req might still not have
            // been aborted.
            if (req) req.abort();
            throw err;
        });
    }

    // Fetches directory info at URL
    getDirectoryInfo(url) {
        if (!url) {
            return Promise.reject("URL not passed.");
        }

        // We'll need to access req later in the Promise chain, so we maintain
        // a external reference
        let req;

        return new Promise((resolve, reject) => {
            // res is IncomingMessage while req is ClientRequest
            req = http(url, res => {
                let data = "";

                if (res.statusCode !== 200) {
                    reject(
                        `Server responded with ${res.statusCode}: ${
                            res.statusMessage
                        }`
                    );
                }

                if (res.headers["content-type"] !== "application/json")
                    reject("URL does not correspond to directory");

                res.on("data", chunk => {
                    data += chunk;
                }).on("end", () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (err) {
                        reject("Corrupted response");
                    }
                });
            }).on("error", err => {
                // Error on request object, returned by http
                reject("Error connecting to server.");
            });
        }).then(
            data => {
                // If previous promise isn't rejected then the HTTP request was
                // completed. No need to abort response if any error occurs now.
                if (!data.children)
                    throw Error("URL does not correspond to directory");

                let origin = new URL(url).origin;

                data.children = data.children.map(child => ({
                    ...child,
                    url: `${origin}/${child.id}`
                }));

                return data;
            },
            err => {
                // If control reaches here, our HTTP request was stopped midway
                // We abort our request
                if (req) req.abort();
                throw err;
            }
        );
    }

    // Allowing the caller to set the id gives a degree of flexibility
    downloadFile(url, id, directory = this.incoming, elist) {
        // Ignore requests where url and download are not defined
        if (!url || !directory) return;

        this.downloads[id] = new FileDownloader(url, directory);
        this.downloads[id]
            .on(events.start, elist.onStart)
            .on(events.progress, elist.onProgress)
            .on(events.error, elist.onError)
            .on(events.cancel, elist.onCancel)
            .on(events.onFinish, elist.onFinish);

        // Return download item so caller can register event listeners
        this.downloads[id].start();
    }

    cancelDownload(id) {
        this.downloads[id].cancel();
    }
}

const client = new Client(config._);

export default client;
