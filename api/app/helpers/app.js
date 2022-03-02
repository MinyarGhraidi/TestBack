const moment = require('moment');
const path = require('path');
const env = process.env.NODE_ENV || 'development';
const appConfig = require(__dirname + '/../config/config.json')[env];
const appSecret = require(__dirname + '/../config/config.json').secret;

const getCurrentDate = () => {
    return moment().format('YYYY-MM-DD');
}

const getCurrentDateTime = () => {
    return moment().format('YYYY-MM-DD HH:mm:ss');
}

const argv = require('yargs')
    .option('path', {
        alias: 'p',
        description: 'root app path',
        type: 'string',
    })
    .help()
    .alias('help', 'h')
    .argv;

const appDir = (argv && argv.path) ? argv.path : path.dirname(require.main.filename);
const get_app_config = () => {
    return require(__dirname + '/../config/config.json')[env];
};
const get_rabbitmq_url = () => {

    const config = get_app_config();
    return 'amqp://' + config.rabbitmq.login + ':' + config.rabbitmq.password + '@' + config.rabbitmq.host + ':' + config.rabbitmq.port;
};

module.exports = {
    appConfig: appConfig,
    env: env,
    appDir: appDir,
    appSecret: appSecret,
    getCurrentDate: getCurrentDate,
    getCurrentDateTime: getCurrentDateTime,
    rabbitmq_url: get_rabbitmq_url(),
};
