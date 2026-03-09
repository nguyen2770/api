const mongoose = require('mongoose');
const fs = require('fs');
const https = require('https');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const { Server } = require("socket.io");

const pfxFile = fs.readFileSync('sslcert/star_medicmms_vn_cert.pfx');
const privateKey = fs.readFileSync('sslcert/privatekey.key');
const certificate = fs.readFileSync('sslcert/RootCA.crt');
const ca = fs.readFileSync('sslcert/Chain_RootCA_Bundle.crt');
const credentials = { pfx: pfxFile, passphrase: '123456' };
let server;

mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
    logger.info('Connected to MongoDB');
    if (config.env === 'production') {

        const httpsServer = https.createServer(credentials, app);

        const io = new Server(httpsServer, {
            cors: { origin: "*" }
        });

        io.on("connection", (socket) => {
            console.log("socket connected:", socket.id);

            socket.on("join", (roomId) => {
                console.log("join room:", roomId);
                socket.join(roomId);
            });
        });
        app.set("io", io);


        server = httpsServer.listen(config.port, () => {
            logger.info(`Listening to port ${config.port}`);
        });
    }
    else {
        server = app.listen(config.port, () => {
            logger.info(`Listening to port ${config.port}`);
        });

        const io = new Server(server, {
            cors: { origin: "*" }
        });

        io.on("connection", (socket) => {
            console.log("socket connected:", socket.id);

            socket.on("join", (roomId) => {
                if (!roomId) return;
                console.log("join room:", roomId);
                socket.join(roomId);
            });
        });


        app.set("io", io);
    }
});

const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger.info('Server closed');
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
};

const unexpectedErrorHandler = (error) => {
    logger.error(error);
    exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    if (server) {
        server.close();
    }
});
