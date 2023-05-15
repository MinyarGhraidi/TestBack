const app_config = require("../helpers/app").appConfig;
const {io, Socket} = require('socket.io-client');
let socket = io(app_config['socketUrl'].toString(), {
    secure: true,
    transports: ["websocket", "polling"],
    rejectUnauthorized: false,
    withCredentials : true,
    cors: { origin: '*' }
}).connect()

class AppSocket extends Socket {
    constructor() {
        super({uri: app_config['socketUrl']})
        const _this = this
        socket.on('connect', () => {
            this.isConnected = true;
            console.log('socket connected',)
        });
        socket.on('connect_error', (error) => {
            socket.removeAllListeners();
            socket.disconnect();
            _this.isConnected = false;
        });
    }


    emit(event, data) {
        return socket.emit(event, data);
    }

    listen(event, callback) {
        return socket.on(event, callback);
    }

}

module.exports = AppSocket;

