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

        // Initially service is not running
        this.running = false;

        this.searchHandler = searchHandler;
        this.port = port;
        this.network = network;
        this.selfRespond = selfRespond;

        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.process = this.process.bind(this);
        this.handleQuery = this.handleQuery.bind(this);

        // Create UDP4 socket with reuseAddr i.e. bind socket even if it is in
        // TIME_WAIT state
        this.socket = Dgram.createSocket("udp4", true);

        this.socket
            .on("error", err => {
                // Root error handler. Fallback in case unexpected error occurs
                logger.error(`UDPService: ${err}`);
                logger.debug(`UDPService: ${err.stack}`);
            })
            .on("message", (mssg, rinf) => {
                this.process(mssg, rinf);
            });
    }

    // Starts the service/server
    start() {
        return new Promise((resolve, reject) => {
            logger.debug("UDPService: Start function called");

            // Note that calling start for the 2nd time before the bind event's
            // callback is called will result in an error. We should wait for
            // the returned Promise to resolve for proper behaviour.
            if (!this.running) {
                this.socket.bind(this.port, () => {
                    let addr = this.socket.address();
                    // Once socket is bound service has started
                    this.running = true;
                    logger.info(
                        `UDPService: Listening on ${addr.address}:${addr.port}`
                    );
                    resolve(true);
                });

                // We register a one time error listener in case bind faces an
                // error. In case of successful bind the listner might be called
                // for some other error event. But our promise is already
                // resolved so it doesn't matter.
                this.socket.once("error", err => {
                    // Error is logged by root handler
                    reject(err);
                });
            } else {
                // If service was already running, return false
                logger.debug(`UDPService.start: Service already running`);
                resolve(false);
            }
        });
    }

    stop() {
        logger.debug("UDPService: Stop function called");

        return new Promise((resolve, reject) => {
            // Note that calling stop for the 2nd time before the first call's
            // Promise is resolved will lead to an error. We should wait for the
            // first promise to resolve.
            if (this.running) {
                this.socket.close(() => {
                    // Once socket has been closed, service has stopped
                    this.running = false;
                    logger.info("UDPService: Service stopped");
                    resolve(true);
                });

                // We register a one time error listener in case close faces an
                // error.
                this.socket.once("error", err => {
                    // Error is logged by root error handler
                    reject(err);
                });
            } else {
                // If service was already stopped return false
                logger.debug(`UDPService.stop: Service already stopped.`);
                resolve(false);
            }
        });
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
