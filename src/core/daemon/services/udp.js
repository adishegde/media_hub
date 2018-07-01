/* UDP service handles search queries */

import Dgram from "dgram";
import Winston from "winston";

import {
    DEFAULT_NETWORK,
    DEFAULT_UDP_PORT,
    DEFAULT_SERVER as DEFAULT
} from "../../utils/constants";
import { isLocalIP } from "../../utils/functions";

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
        {
            udpPort: port = DEFAULT_UDP_PORT,
            network = DEFAULT_NETWORK,
            selfRespond = DEFAULT.selfRespond
        }
    ) {
        if (!searchHandler) {
            logger.error("SearchHandler not passed to UDPService constructor.");
            throw Error("SearchHandler not passed to UDPService constructor.");
        }

        this.searchHandler = searchHandler;
        this.port = port;
        this.network = network;
        this.selfRespond = selfRespond;

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
    async process(mssg, rinf) {
        try {
            let query = JSON.parse(mssg);
            if (query.network !== this.network) {
                logger.debug(
                    `UDPService: Query doesn't belong to same network.`
                );
                return;
            }
            if (!query.search) {
                logger.debug(`UDPService: Search string is falsy.`);
                return;
            }
            if (!this.selfRespond && isLocalIP(rinf.address)) {
                // Do not reply if selfRespond is disabled and request is from
                // same machine
                logger.debug(
                    `UDPservice: Request from local machine. Self respond is disabled.`
                );
                return;
            }
            await this.handleQuery(query, rinf);
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

        let resultProm;

        switch (query.param) {
            case "name":
                resultProm = this.searchHandler.searchByName(query.search);
                break;
            case "tag":
                resultProm = this.searchHandler.searchByTag(query.search);
                break;
            default:
                resultProm = this.searchHandler.search(query.search);
        }

        // searchHandler returns a Promise
        return resultProm.then(results => {
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
        });
    }
}
