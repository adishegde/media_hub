/* Complete server class. Creating an instance of this would take care of all
 * services */
import Winston from "winston";
import * as Fs from "fs";
import * as Path from "path";

import UDPService from "./services/udp";
import HTTPService from "./services/http";
import MetaData from "./fileIndex/metaData";
import FileIndex from "./fileIndex/fileIndex";
import SearchHandler from "./fileIndex/searchHandler";

const logger = Winston.loggers.get("daemon");

export default class Server {
    // Error will be thrown if port and directories are undefined. Defaults
    // exist for other options
    constructor(config) {
        if (!config.share) {
            logger.error("Server: Share not passed to server.");
            throw Error("Share not passed to server.");
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
            this.metaDataHandler = new MetaData(config);
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
            if (this.udpServer) this.udpServer.stop();
            if (this.fileIndex) this.fileIndex.stop();
            if (this.httpServer) this.httpServer.stop();

            throw err;
        }
    }

    // Start services
    start() {
        this.fileIndex.start();
        this.udpServer.start();
        this.httpServer.start();
    }

    stop() {
        this.fileIndex.stop();
        this.udpServer.stop();
        this.httpServer.stop();
    }
}
