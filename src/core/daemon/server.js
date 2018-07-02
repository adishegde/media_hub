/* Complete server class. Creating an instance of this would take care of all
 * services */
import Winston from "winston";
import * as Fs from "fs";
import * as Path from "path";
import Level from "level";

import UDPService from "./services/udp";
import HTTPService from "./services/http";
import MetaData from "./fileIndex/metaData";
import FileIndex from "./fileIndex/fileIndex";
import SearchHandler from "./fileIndex/searchHandler";
import { DEFAULT_SERVER as DEFAULT } from "../utils/constants";

const logger = Winston.loggers.get("daemon");

// Server takes db as a constructor argument. This is not necessarily an anti
// pattern. Something similar to how an external db is connected to a web
// server. This provides the necessary flexibility in the GUI app.
export default class Server {
    // Error will be thrown if port and directories are undefined. Defaults
    // exist for other options
    // Params:
    //  - db: A db instance whose API is compatible with levelup. In case it is
    //  a string or null then db is taken as the db path. Value for db must
    //  be json encoded.
    //  - config: The server configuration. This object will be passed onto
    //  individual services.
    constructor(db = DEFAULT.db, config) {
        if (!config.share) {
            logger.error("Server: Share not passed to server.");
            throw Error("Share not passed to server.");
        }

        if (typeof db === "string") {
            // If db path passed through config then use that path
            if (db === DEFAULT.db && config.db) db = config.db;

            try {
                db = Level(db, { valueEncoding: "json" });
                // Server created db, it's responsible for closing it
                this.closeDb = true;
            } catch (err) {
                logger.error(`Server: Error opening db ${err}`);
                // Rethrow error
                throw err;
            }
        }

        // Resolve any relative to absolute paths
        let share = config.share.map(path => Path.resolve(path));

        // Filter out directories from array of paths
        share = share.filter(path => {
            try {
                // Synchronous since this is initialization
                // Initial setup should be completed before accetpting requests
                let stat = Fs.statSync(path);
                if (!stat.isDirectory()) {
                    logger.error(
                        `Server: ${path} will not be indexed since it is not a directory.`
                    );

                    return false;
                }
            } catch (error) {
                // If error is thrown then dir at path does not exist
                logger.error(
                    `Server: ${path} will not be indexed since it does not exist.`
                );
                return false;
            }

            return true;
        });

        // Reassign share to config
        config.share = share;

        try {
            this.db = db;
            this.metaDataHandler = new MetaData(this.db, config);
            this.fileIndex = new FileIndex(this.metaDataHandler, config);
            this.searchHandler = new SearchHandler(
                this.metaDataHandler,
                config
            );
            this.udpServer = new UDPService(this.searchHandler, config);
            this.httpServer = new HTTPService(this.metaDataHandler, config);
        } catch (err) {
            logger.error(`Server: ${err}`);
            logger.debug(`Server: ${err.stack}`);

            // Stop if initialized
            if (this.closeDb)
                this.db.close(err => {
                    if (err)
                        logger.error(`Server: Error while closing db ${err}`);
                });
            if (this.udpServer) this.udpServer.stop();
            if (this.fileIndex) this.fileIndex.stop();
            if (this.httpServer) this.httpServer.stop();

            throw err;
        }
    }

    // Start services
    start() {
        return {
            fileIndex: this.fileIndex.start(),
            udp: this.udpServer.start(),
            http: this.httpServer.start()
        };
    }

    stop() {
        let stopPromises = {};

        if (this.closeDb && this.db)
            stopPromises.db = this.db.close().then(() => {
                logger.info("Server.stop: Db connection closed.");
            });
        if (this.udpServer) stopPromises.udp = this.udpServer.stop();
        if (this.fileIndex) stopPromises.fileIndex = this.fileIndex.stop();
        if (this.httpServer) stopPromises.http = this.httpServer.stop();

        return stopPromises;
    }
}
