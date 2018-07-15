/* Extends the core client to support HTTP requests */
import { get as http } from "http";

import ClientCore from "core/client/client";

// No point in doing a lot of checks on URL like in the case of cli since the
// app is responsible for URL. Thus as long as data is managed correctly by the
// app no unexpected errors should occur.
export default class Client extends ClientCore {
    constructor(config) {
        // Setup options by calling core client constructor
        super(config);
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
}
