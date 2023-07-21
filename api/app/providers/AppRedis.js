const redis = require("redis");
const { appConfig } = require("../helpers/app");


class AppRedis {
    constructor() {
        //console.log('appConfig.redis',appConfig)
        this.client = redis.createClient({url: 'redis://'+appConfig.redis.host+':'+appConfig.redis.port,legacyMode: true});
    }
}

module.exports = AppRedis;
