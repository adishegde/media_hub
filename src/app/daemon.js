/* This script starts the daemon and listens to messages by the main
 * process. It is intended to be spawned as a child process */

import Level from "level";
import Winston from "winston";

import { addLogFile } from "core/utils/log";
import { daemonChannels as Dc } from "app/utils/constants";
import Server from "core/daemon/server";

const logger = Winston.loggers.get("daemon");

// Reference to server
let server;

// Reference to db
let db;

function restartDaemon({ config }) {
    logger.debug("Daemon: Received restart message.");

    let promises = [];

    // Stop server if it's running
    if (server) promises = server.stop();

    // We accumulate all errors here so that it can be passed with the
    // callback
    let errors = [];

    Promise.all(promises)
        .catch(err => {
            // We don't want this error to stop creation of new server. We
            // catch it and continue with creation of new server.
            errors.push(err.message);
            logger.error(`Daemon.restart: Error while stopping server: ${err}`);
            logger.debug(`${err.stack}`);
        })
        .then(() => {
            // Create new server using app settings
            // Passes existing db instance
            server = new Server(db, config);
            return Promise.all(Object.values(server.start()));
        })
        .catch(err => {
            // we combine this with existing errors so that it can be
            // passed with the finsih event
            errors.push(err.message);
            logger.error(`Daemon: Error while starting server: ${err}`);
            logger.debug(`${err.stack}`);
        })
        .then(err => {
            //  if no errors have occured then don't send an array (which is a
            //  (truthy value)
            if (errors.length === 0) errors = undefined;

            // Signal the main process that server restart is over.
            // Pass the array of errors which is somewhat similar to the
            // nodejs pattern.
            process.send({ type: Dc.RESTART, errors });
        });
}

function init({ dbPath, logPath, logLevel = "error" }) {
    let error;

    try {
        // Create db
        // Once created here, it's not closed for the lifetime of the app
        db = Level(dbPath, { valueEncoding: "json" });

        // Add log file
        addLogFile("daemon", logPath, logLevel);
    } catch (err) {
        // Capture error so that it can be sent with the finished event
        error = err;
    } finally {
        process.send({ type: Dc.INIT, error });
    }
}

function cleanup() {
    logger.debug("Daemon: Received cleanup message.");

    let promises = [];
    let errors = [];

    if (server) promises = Object.values(server.stop());

    Promise.all(promises)
        .catch(err => {
            // An error in stopping server shouldn't affect the closing
            // of db
            errors.push(err.message);
            logger.error(`Daemon: Error while stopping server: ${err}`);
            logger.debug(`${err.stack}`);
        })
        .then(() => {
            if (db) return db.close();
        })
        .catch(err => {
            errors.push(err.message);
            logger.error(`Daemon: Error while closing db: ${err}`);
            logger.debug(`${err.stack}`);
        })
        .then(() => {
            // If no error occured then send falsy value for errors
            if (errors.length === 0) errors = undefined;

            process.send({ type: Dc.CLEANUP, errors });
        });
}

const mapTypeToHandler = {
    [Dc.RESTART]: restartDaemon,
    [Dc.INIT]: init,
    [Dc.CLEANUP]: cleanup
};

process.on("message", mssg => {
    if (mapTypeToHandler[mssg.type]) {
        mapTypeToHandler[mssg.type](mssg.payload);
    }
});
