const message_channel_subscriberDao = require('../bo/message_channel_subscriberDao');
let message_channel_subscriberDaoInst = new message_channel_subscriberDao;


module.exports = {

    update: function (req, res, next) {
        message_channel_subscriberDaoInst.update(req, res, next);
    },
    get: function (req, res, next) {
        message_channel_subscriberDaoInst.find(req, res, next);
    },
    getById: function (req, res, next) {
        message_channel_subscriberDaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        message_channel_subscriberDaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        message_channel_subscriberDaoInst.delete(req, res, next);
    },
};
