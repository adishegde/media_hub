/* Complete server class. Creating an instance of this would take care of all
 * services */

import UDPService from "./services/udp";
import HTTPService from "./services/http";
import MetaData from "./fileIndex/metaData";
import FileIndex from "./fileIndex/fileIndex";
import SearchHandler from "./fileIndex/searchHandler";
import logger from "../utils/log";

export default class Server {
    // Error will be thrown if port and directories are undefined. Defaults
    // exist for other options
    constructor(config) {
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
