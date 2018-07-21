import { get as Http } from "http";
import EventEmitter from "events";
import UnusedFileName from "unused-filename";
import * as Fs from "fs";
import * as Path from "path";

import { downloadStatus as status } from "./constants";

export const events = {
    start: "start",
    error: "error",
    progress: "progress",
    finish: "finish",
    cancel: "cancel"
};

export default class FileDownloader extends EventEmitter {
    constructor(url, directory) {
        super();

        if (!url) {
            throw Error("Url not passed");
        }
        if (!directory) {
            throw Error("Directory not passed");
        }

        this.url = url;
        this.directory = directory;
        this._status = status.idle;

        this.start = this.start.bind(this);
        this.cancel = this.cancel.bind(this);
    }

    // Start downloading file
    // Emits start event when file name and size have been resolved. If response
    // code is not 200 then an error event might be emitted before the start
    // event
    start() {
        // Ignore if already downloading
        if (this._status === status.downloading) return;

        this._request = Http(this.url, res => {
            // Handle incorrect responses
            // This error event might be emitted before the start event. This
            // can't be helped since the reponse it self is wrong.
            if (res.statusCode !== 200) {
                this._handleError(
                    new Error(
                        `Server responded with ${res.statusCode}: ${
                            res.statusMessage
                        }`
                    )
                );
                // Download failed
                return;
            }

            // Store a reference to res
            this._response = res;

            let fileName = this._response.headers["content-disposition"];
            // Extract filename from header. Assumption is that the
            // header is exactly as returned by the http service.
            // Might throw errors for other headers
            fileName = fileName.replace(`inline; filename="`, "");
            // Remove trailing double quote
            fileName = fileName.slice(0, fileName.length - 1);
            // Remove percent encoded characters
            fileName = decodeURIComponent(fileName);

            // Get full file path
            let filePath = Path.join(this.directory, fileName);

            // Get unused filename
            UnusedFileName(filePath)
                .then(unusedpath => {
                    // Assign the file name to instance
                    this._filepath = unusedpath;
                })
                .then(() => {
                    // No point wrapping this in promise. Communication with
                    // outside world occurs through events

                    // Extract file size from header
                    this._size = parseInt(
                        this._response.headers["content-length"],
                        10
                    );
                    // Keep track of bytes downloaded
                    this._bytesDownloaded = 0;

                    // We emit start event now. Note that there might be an
                    // error event after this point. But the start event is
                    // emitted to notify the user about the resolved filename
                    // and size of file. Moreover it makes sense to have error
                    // events after the start event
                    this.emit(
                        events.start,
                        this._filepath,
                        this._size,
                        this.url
                    );
                    this._status = status.downloading;

                    // Create a write stream. If directory does not exist or
                    // permission not given then error will be thrown
                    this._fileStream = Fs.createWriteStream(this._filepath, {
                        flags: "wx"
                    })
                        .on("error", err => {
                            // Send error with user friendly message
                            this._handleError(new Error("Writing to file"));
                        })
                        .on("open", () => {
                            // add event listeners to res only after file has been
                            // successfully opened. This ensures that events are
                            // emitted only if fileStream opened successfully
                            this._response.on("data", chunk => {
                                this._bytesDownloaded += chunk.length;
                                this._progress(chunk.length);
                            });

                            // Pipe data to write stream i.e. write to file
                            this._response.pipe(this._fileStream);
                        })
                        .on("finish", () => {
                            this._finish();
                        });
                });
        });

        this._request.on("error", err => {
            this._handleError(err);
        });
    }

    // Handles errors that require download to stop
    _handleError(err) {
        this._cleanUp()
            .catch(clerr => {
                // Concat clean up and actual err
                err = new Error(`${err.message} and ${clerr.message}`);
            })
            .then(() => {
                this._status = status.error;
                this.emit(events.error, err.toString(), this.url);
            });
    }

    // Cleans up all resources used by download
    _cleanUp() {
        return new Promise((resolve, reject) => {
            if (this._request) {
                this._request.abort();
                this._request = null;
            }
            if (this._response) {
                this._response.unpipe();
                this._response = null;
            }
            if (this._fileStream) {
                this._fileStream.destroy();

                // Delete file
                Fs.unlink(this._filepath, err => {
                    if (err) reject(new Error("Removing file"));

                    this._fileStream = null;
                    resolve();
                });
            } else {
                // If file stream was not created then resolve promise
                resolve();
            }
        });
    }

    // Emit download progress event
    _progress(delta) {
        let ratio = 0;
        if (this._size) ratio = this._bytesDownloaded / this._size;
        this.emit(events.progress, ratio, delta, this.url);
    }

    // Emit finish event when download has finished
    _finish() {
        this.emit(events.finish, this.url);
        this._status = status.finished;

        // Assign to null so that the values may be garbage collected
        this._request = null;
        this._fileStream = null;
        this._response = null;
    }

    // Cancel an ongoing download
    cancel() {
        this._cleanUp()
            .catch(err => {
                this.emit(events.error, err, this.url);
            })
            .then(() => {
                this.emit(events.cancel, this.url);
                this._status = status.cancelled;
            });
    }

    getBytesDownloaded() {
        return this._bytesDownloaded;
    }
}
