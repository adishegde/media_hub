/* UDP service handles search queries */

import Dgram from "dgram";
import Winston from "winston";

import { DEFAULT_NETWORK, DEFAULT_UDP_PORT } from "../../utils/constants";

/* The UDP service listens on a given port and responds to incoming search
 * queries on the port of the client. Thus it makes no assumption about the
 * client port.
 */

const logger = Winston.loggers.get("daemon");

export default class UDPservice {
    // Params:
    //  - searchHandler: Instance of searchHandler class. Used to get search
    //  results.
    //  - An object having properties:
    //    - port [optional]: Port at which the UDP server should listen.
    //    - network [optional]: Identifier for network
    constructor(
        searchHandler,
        { udpPort: port = DEFAULT_UDP_PORT, network = DEFAULT_NETWORK }
    ) {
        if (!searchHandler) {
            logger.error("SearchHandler not passed to UDPService constructor.");
            throw Error("SearchHandler not passed to UDPService constructor.");
        }

        this.searchHandler = searchHandler;
        this.port = port;
        this.network = network;

        // Create UDP4 socket with reuseAddr i.e. bind socket even if it is in
        // TIME_WAIT state
        this.socket = Dgram.createSocket("udp4", true);

        this.socket
            .on("listening", () => {
                let addr = this.socket.address();
                logger.info(
                    `UDPService: Listening on ${addr.address}:${addr.port}`
                );
            })
            .on("error", err => {
                logger.error(`UDPService: ${err}`);
                logger.debug(`UDPService: ${err.stack}`);
            })
            .on("message", (mssg, rinf) => {
                this.process(mssg, rinf);
            })
            .on("close", () => {
                logger.info("UDPService: Service stopped");
            });
    }

    // Starts the service/server
    start() {
        logger.debug("UDPService: Start function called");
        this.socket.bind(this.port);
    }

    stop() {
        logger.debug("UDPService: Stop function called");
        this.socket.close();
    }

    // Processes and validates incoming requests
    process(mssg, rinf) {
        try {
            let query = JSON.parse(mssg);
            if (query.network !== this.network) {
                throw Error("Query doesn't belong to same network");
            }
            if (!query.search) {
                throw Error("Search string is falsy");
            }

            this.handleQuery(query, rinf);
        } catch (err) {
            logger.info(`UDPService: ${err}`);
            logger.debug(`UDPService: ${err.stack}`);
            return;
        }
    }

    // Gets search results and sends it to destination
    handleQuery(query, rinf) {
        logger.info(
            `UDPService: ${query.search}:${query.param ||
                "default"} search request recieved from ${rinf.address}:${
                rinf.port
            }`
        );

        let results = [];

        switch (query.param) {
            case "name":
                results = this.searchHandler.searchByName(query.search);
                break;
            case "tag":
                results = this.searchHandler.searchByTag(query.search);
                break;
            default:
                results = this.searchHandler.search(query.search);
        }

        // Send only name and id of file in response
        results = results.map(result => [result.name, result.id]);

        // Complete response object
        let response = {
            network: query.network,
            search: query.search,
            param: query.param,
            results: results
        };
        response = JSON.stringify(response, null, 0);

        // Send response to destination port and address
        this.socket.send(response, rinf.port, rinf.address);
    }
}
