/* Complete server class. Creating an instance of this would take care of all
 * services */

import UDPService from "./services/udp";
import MetaData from "./fileIndex/metaData";
import FileIndex from "./fileIndex/fileIndex";
import SearchHandler from "./fileIndex/searchHandler";
import logger from "./utils/log";

export default class Server {
    // Error will be thrown if port and directories are undefined. Defaults
    // exist for other options
    constructor({
        port,
        networkName,
        shared,
        pollingInterval,
        dbPath,
        dbwriteInterval,
        maxResults
    }) {
        try {
            this.metaDataHandler = new MetaData(dbPath, dbwriteInterval);
            this.fileIndex = new FileIndex(
                shared,
                this.metaDataHandler,
                pollingInterval
            );
            this.searchHandler = new SearchHandler(
                this.metaDataHandler,
                maxResults
            );
            this.udpServer = new UDPService(
                this.searchHandler,
                port,
                networkName
            );
        } catch (err) {
            logger.error(`Server: ${err}`);
            logger.debug(`Server: ${err.stack}`);

            this.udpServer.stop();
            this.fileIndex.stop();

            throw err;
        }
    }

    // Start services
    start() {
        this.fileIndex.start();
        this.udpServer.start();
    }

    stop() {
        this.fileIndex.stop();
        this.udpServer.stop();
    }
}
