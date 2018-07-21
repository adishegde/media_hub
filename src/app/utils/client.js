/* Extends the core client to support HTTP requests */
import { get as http } from "http";
import { remote } from "electron";
import * as Path from "path";
import * as Util from "util";
import * as Fs from "fs";
import { Url } from "url";

import ClientCore from "core/client/client";
import FileDownloader, { events } from "./fileDownloader";
import { addLogFile } from "core/utils/log";
import { CLIENT_LOG } from "app/utils/constants";

const config = remote.getGlobal("config");
const app = remote.app;
const mkdir = Util.promisify(Fs.mkdir);

// Instead of checking for truthiness of listeners, just keep this as a default
// Negligible perfomance drop
function dummyFunction() {}

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

        // Bind functions to prevent errors when functions are called in other
        // places
        this.downloadFile = this.downloadFile.bind(this);
        this.downloadDirectory = this.downloadDirectory.bind(this);
        this.getMeta = this.getMeta.bind(this);
        this.cancelDownload = this.cancelDownload.bind(this);
        this.getDirectoryInfo = this.getDirectoryInfo.bind(this);
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

    // Download a file.
    // Param:
    //  - url: URL of file to download.
    //  - id: Download request id.
    //  - elist: Object of event listeners:
    //    - onStart: Called when download has started. File path, size and url
    //    are param.
    //    - onProgress: Called when download progresses. Ratio of download and
    //    url, delta (the change) and url are passed as param.
    //    - onError: Called when an error occurs. Note that if the server
    //    response is not 200 then this might be called before onStart.
    //    - onCancel: Called when the download is cancelled. URL is passed as
    //    param.
    //    - onFinish: Called when the download has been completed. URL is
    //    passed as param.
    //
    // The file is deleted if download is cancelled or if error occurs.
    downloadFile(
        url,
        id,
        {
            onStart = dummyFunction,
            onProgress = dummyFunction,
            onError = dummyFunction,
            onCancel = dummyFunction,
            onFinish = dummyFunction
        }
    ) {
        // Ignore requests where url and directory are not defined
        if (!url || !this.incoming) return;

        this.downloads[id] = new FileDownloader(url, this.incoming);
        this.downloads[id]
            .on(events.start, onStart)
            .on(events.progress, onProgress)
            .on(events.error, onError)
            .on(events.cancel, onCancel)
            .on(events.finish, onFinish);

        // Return download item so caller can register event listeners
        this.downloads[id].start();
    }

    // Cancel an ongoing download
    // Param:
    //  - id: The download request id.
    //  - callback: Called when download is cancelled. Basically added as event
    //  listener for events.cancel event. API is similar to nodejs standard
    //  pattern.
    cancelDownload(id, callback = dummyFunction) {
        let fd = this.downloads[id];

        if (fd instanceof FileDownloader) {
            // fd corresponds to a file

            // Add event listener and cancel download
            this.downloads[id].on(events.cancel, callback);
            this.downloads[id].cancel();
        } else {
            // fd corresponds to a directory

            // We create a list of promises that resolve when each promise has
            // been cancelled.
            let promises = Object.values(fd).map(
                filefd =>
                    new Promise(resolve => {
                        filefd.on(events.cancel, resolve);
                        filefd.cancel();
                    })
            );

            Promise.all(promises).then(() => {
                callback();
            });
        }
    }

    // Download a directory.
    // Param:
    //  - url: URL of directory to download
    //  - id: Download request id.
    //  - elist: Object of event listeners:
    //     - onStart: Emitted when the download has started. Resolved dir path,
    //     dir size and url are passed as param.
    //     - onFinish: Emitted when the download has completed. List of errors
    //     when downloading subfiles and url are passed as params.
    //     - OnError: Called if the download failed. Can occur if dir data could
    //     not be fetched or directory could not be created.
    //     - OnProgress: Called when the directory download progresses.
    async downloadDirectory(
        url,
        id,
        {
            onStart = dummyFunction,
            onFinish = dummyFunction,
            onError = dummyFunction,
            onProgress = dummyFunction
        }
    ) {
        try {
            // Ignore requests where url and directory are not defined
            if (!url || !this.incoming) return;

            // We create an object to manage the list of download items
            // Each download item here corresponds to a file download
            this.downloads[id] = {};

            // Get list of children and directory name
            let dirData = await this.getDirectoryInfo(url);
            // Get path of new directory
            let dirPath = Path.join(this.incoming, dirData.name);

            try {
                // Create new directory
                await mkdir(dirPath);
            } catch (err) {
                // If error occurs due to directory already existing then
                // just continue. Else rethrow error.
                if (err.code !== "EEXIST") {
                    throw err;
                }
            }

            // now we know for sure that the directory exists.

            // Emit start event. Or rather simulate it.
            onStart(dirPath, dirData.size, url);

            // Keep track of directory progress
            let progress = 0;

            // Accumulate all errors
            let errorList = [];

            // Wrapper around on Progress for directory
            let _onProgress = (ratio, delta, url) => {
                progress += delta;
                onProgress(progress / dirData.size);
            };

            let _onError = (url, path, err) => {
                errorList.push({
                    url,
                    path,
                    err
                });
            };

            this._downloadDirectory(new URL(url).origin, id, dirPath, dirData, {
                onProgress: _onProgress,
                onError: _onError
            }).then(() => {
                // The onFinish "event" is "emitted" with the list of all errors and
                // the url
                onFinish(errorList, url);
            });
        } catch (err) {
            // Directory download didn't even start (most probably)
            onError(err, url);
        }
    }

    // Actually downloads the directory. A lot of data has to be passed to
    // prevent unnecessary fetches.
    //
    // Param:
    //  - origin: URL origin.
    //  - id: Id of the root directory
    //  - dirPath: Path of directory to download. It is assumed that the directory
    //  exists.
    //  - dirData: Data of the dir to be downloaded as obtained form getDirectoryInfo
    //  - elist: List of event listeners.
    //
    //  Return Value:
    //   A promise that is resolved to an array. The individual values itself
    //   might be undefined or an array of similar type. The only use of the
    //   promise is to show that the directory download has completed.
    //
    //   Any error caught is passed to the onError handler with the url and
    //   path.
    _downloadDirectory(origin, id, dirPath, dirData, { onProgress, onError }) {
        let promises = [];

        // downloading children
        for (let child of dirData.children) {
            let childUrl = `${origin}/${child.id}`;

            if (child.type === "file") {
                // We download the file
                // No need to add event listeners for all events. We basically
                // want to combine the info of all these file downloads into
                // the directory download info.
                promises.push(
                    new Promise((resolve, reject) => {
                        // Assign a probable path. In case of error before
                        // start event this will be used
                        let chPath = Path.join(dirPath, child.name);

                        let fd = new FileDownloader(childUrl, dirPath)
                            .on(events.progress, onProgress)
                            .on(events.start, path => {
                                // The actual download path
                                chPath = path;
                            })
                            .on(events.finish, () => {
                                // Once the download finishes we delete the downloader
                                // from our map
                                delete this.downloads[id][childUrl];

                                // Resolve promise after download
                                resolve();
                            })
                            .on(events.error, err => {
                                onError(childUrl, chPath, err);
                                // We resolve the promise to true to dento that
                                // downloading has stopped
                                resolve();
                            });

                        // Add downloader to map
                        this.downloads[id][childUrl] = fd;

                        // Start download
                        fd.start();
                    })
                );
            } else {
                let childPath = Path.join(dirPath, child.name);

                // Download directory
                promises.push(
                    // We first create the child directory, get the child dir
                    // info and then download the contents of the child
                    // directory
                    mkdir(childPath)
                        .catch(err => {
                            // If directory already exists then ignore and continue
                            // else rethrow error
                            if (err.code !== "EEXIST") {
                                throw err;
                            }
                        })
                        .then(() => this.getDirectoryInfo(childUrl))
                        .then(data =>
                            this._downloadDirectory(
                                origin,
                                id,
                                childPath,
                                data,
                                {
                                    onProgress,
                                    onError
                                }
                            )
                        )
                        .catch(err => {
                            // The promise may be rejected if the directory
                            // could not be created or fetching dir data failed                             //

                            // But we don't want the promise to be rejcted since
                            // we are using Promise.all. We call onError and
                            // resolve it
                            onError(childUrl, childPath, err);
                        })
                );
            }
        }

        // The returned promise should be resolved when all files have been
        // downloaded. None of the promises should be rejected. Also each value
        // resolves to undefined or an array of undefined depending on a file or
        // dir.
        return Promise.all(promises);
    }
}

const client = new Client(config._);

export default client;
