let io;

module.exports = {
    init: (server) => {
        const { Server } = require("socket.io");
        io = new Server(server, {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: false,
        });
        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error("Socket.io chưa được khởi tạo!");
        }
        return io;
    }
};