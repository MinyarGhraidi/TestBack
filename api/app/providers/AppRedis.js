const redis = require("redis");
const { appConfig } = require("../helpers/app");

class AppRedis {
    constructor() {
        console.log(appConfig.redis)
        this.client = redis.createClient({url: 'redis://'+appConfig.redis.host+':'+appConfig.redis.port});
    }
}

module.exports = AppRedis;
