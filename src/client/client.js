// Client makes the request

import Dgram from "dgram";

import Winston from "winston";
import {
    DEFAULT_CLIENT as DEFAULT,
    DEFAULT_UDP_PORT,
    DEFAULT_NETWORK,
    DEFAULT_HTTP_PORT
} from "../utils/constants";

const logger = Winston.loggers.get("client");

export default class Client {
    // Params:
    //  An object consisting of the following options:
    //   - port: The port to which the client should bind to.
    //   - udpPort: The port of UDP server to which requests should be sent
    //   - httpPort: The port of the HTTP server for making requests
    //   - networkName [optional]: The network to which requests should
    //   belong. Default is "Media_Hub".
    //   - broadcastIp [optional]: The IP address to which broadcasts will
    //   be made. Default value is "255.255.255.255".
    //   - timeout [optional]: The time to listen for responses to udp
    //   requests. Default value is 3 seconds
    constructor({
        clientPort: port = DEFAULT.port,
        udpPort = DEFAULT_UDP_PORT,
        httpPort = DEFAULT_HTTP_PORT,
        networkName = DEFAULT_NETWORK,
        broadcastIp = DEFAULT.broadcastIp,
        timeout = DEFAULT.timeout
    }) {
        this.port = port;
        this.udpPort = udpPort;
        this.httpPort = httpPort;
        this.networkName = networkName;
        this.broadcastIp = broadcastIp;
        this.timeout = timeout;
    }

    // Broadcast search request
    // Params:
    //  - searchString: The string to search for
    //  - param [optional]: Search for name or tag. Empty implies no data
    //  will be sent to server.
    //
    //  Return Value:
    //   A Promise that is resolved to the results of the search
    search(searchString, param) {
        return new Promise((resolve, reject) => {
            if (typeof searchString !== "string") {
                logger.debug(
                    `Client: searchString is of type ${typeof searchString}`
                );
                reject("searchString should be of type string");
            }

            let request = {
                network: this.networkName,
                search: searchString,
                param: param || "default"
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
                            response.param === request.param
                        ) {
                            let url = `${rinf.address}:${this.httpPort}`;

                            // Add results to responseAcc
                            response.results.forEach(result => {
                                resultAcc.push({
                                    name: result[0],
                                    url: `${url}/${result[1]}`
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

                let addr = socket.address();
                logger.debug(
                    `Client: search request for ${request.search}:${
                        request.param
                    } sent via ${addr.address}:${addr.port}`
                );

                // Send request via socket
                socket.send(requestString, this.udpPort, this.broadcastIp);

                // Add timeout for listening to responses
                setTimeout(() => {
                    logger.debug(
                        `Client: ${
                            this.timeout
                        } elapsed since search request. Timeout for response.`
                    );
                    socket.close();
                }, this.timeout);
            });
        });
    }
}
