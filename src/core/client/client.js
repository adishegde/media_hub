/* Client exports the search method for making broadcast requests. HTTP related
 * functionality is not implemented so that the cli and electron app can use
 * better or native ways to make requests. Basically only common functionality
 * is implemented here. */

import Net from "net";
import Dgram from "dgram";
import Winston from "winston";

import {
    DEFAULT_CLIENT as DEFAULT,
    DEFAULT_UDP_PORT,
    DEFAULT_NETWORK,
    DEFAULT_MULTICAST,
    DEFAULT_HTTP_PORT,
    SEARCH_PARAMS
} from "../utils/constants";

const logger = Winston.loggers.get("client");

export default class Client {
    // Params:
    //  An object consisting of the following options:
    //   - port: The port to which the client should bind to.
    //   - udpPort: The port of UDP server to which requests should be sent
    //   - httpPort: The port of the HTTP server for making requests
    //   - network [optional]: The network to which requests should
    //   belong. Default is "Media_Hub".
    //   - broadcastIp [optional]: The IP address to which broadcasts will
    //   be made. Default value is "255.255.255.255".
    //   - timeout [optional]: The time to listen for responses to udp
    //   requests. Default value is 3 seconds
    //   - useBroadcast [optional]: Use broadcast instead of multicast
    //   - mcAddr [optional]: Mutlicast address.
    constructor({
        clientPort: port = DEFAULT.port,
        udpPort = DEFAULT_UDP_PORT,
        httpPort = DEFAULT_HTTP_PORT,
        network = DEFAULT_NETWORK,
        broadcastIp = DEFAULT.broadcastIp,
        timeout = DEFAULT.timeout,
        useBroadcast = DEFAULT.useBroadcast,
        mcAddr = DEFAULT_MULTICAST
    }) {
        if (useBroadcast) {
            logger.debug(
                "Client: useBroadcast is true. Will send only broadcast messages."
            );
        }
        if (!Net.isIPv4(mcAddr)) {
            logger.debug(
                "Client: mcAddr is not of IPv4 type. Will send only broadcast messages."
            );
            useBroadcast = true;
        }

        this.port = port;
        this.udpPort = udpPort;
        this.httpPort = httpPort;
        this.network = network;
        this.broadcastIp = broadcastIp;
        this.timeout = timeout;

        // If broadcast requests have to be sent override broadcastIp
        // Thus useBroadcast and mcAddr are not stored
        if (!useBroadcast) {
            logger.debug(
                `Client: Will send multicast search requests to ${mcAddr}`
            );
            this.broadcastIp = mcAddr;
        }
    }

    // Broadcast search request
    // Params:
    //  - searchString: The string to search for
    //  - page: The page to retrieve
    //  - param [optional]: Any value of SEARCH_PARAMS as exported by
    //  utils/constants
    //
    //  Return Value:
    //   A Promise that is resolved to the results of the search
    search(searchString, page = 1, param = SEARCH_PARAMS.names) {
        return new Promise((resolve, reject) => {
            if (typeof searchString !== "string") {
                logger.debug(
                    `Client.search: searchString is of type ${typeof searchString}`
                );
                reject("searchString should be of type string");
            }

            let request = {
                network: this.network,
                search: searchString,
                param,
                page
            };

            let requestString = JSON.stringify(request, null, 0);

            // Accumulate results from all responses in array
            let resultAcc = [];

            // Create UDP4 socket with reuseAddr
            // Socket is created for every search request for lack of better
            // alternative
            let socket = Dgram.createSocket("udp4", true);
            // Add event listeners to handle response
            socket
                .on("error", err => {
                    logger.error(`Client.search: ${err}`);
                    logger.debug(`Client.search: ${err.stack}`);

                    // Rejected if socket error occurs. Mainly if address is
                    // already used
                    reject(err);
                })
                .on("message", (mssg, rinf) => {
                    try {
                        let response = JSON.parse(mssg);
                        if (
                            response.network === request.network &&
                            response.search === request.search &&
                            response.param === request.param &&
                            response.page === request.page
                        ) {
                            let url = `http://${rinf.address}:${this.httpPort}`;

                            // Add results to responseAcc
                            response.results.forEach(result => {
                                resultAcc.push({
                                    name: result[0],
                                    url: `${url}/${result[1]}`,
                                    downloads: result[2]
                                });
                            });
                        }
                    } catch (err) {
                        logger.debug(`Client.search.socketMessage: ${err}`);
                    }
                })
                .on("close", () => {
                    logger.debug("Client.search: Search socket closed");

                    // Resolve promise to result
                    resolve(resultAcc);
                });

            socket.bind(this.port, () => {
                // Set broadcast
                socket.setBroadcast(true);

                // Max number of hops is 128
                socket.setTTL(128);
                socket.setMulticastTTL(128);

                let addr = socket.address();
                logger.debug(
                    `Client.search: search request for ${request.search}:${
                        request.param
                    } sent via ${addr.address}:${addr.port} to ${
                        this.broadcastIp
                    }:${this.udpPort}`
                );

                // Send request via socket
                socket.send(requestString, this.udpPort, this.broadcastIp);

                // Add timeout for listening to responses
                setTimeout(() => {
                    logger.debug(
                        `Client.search: ${
                            this.timeout
                        } elapsed since search request. Timeout for response.`
                    );
                    socket.close();
                }, this.timeout);
            });
        });
    }
}
