const message_readerDao = require('../bo/message_readerDao');
let message_readerDaoInst = new message_readerDao();


module.exports = {

    update: function (req, res, next) {
        message_readerDaoInst.update(req, res, next);
    },
    get: function (req, res, next) {
        message_readerDaoInst.find(req, res, next);
    },
    getById: function (req, res, next) {
        message_readerDaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        message_readerDaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        message_readerDaoInst.delete(req, res, next);
    },
};
