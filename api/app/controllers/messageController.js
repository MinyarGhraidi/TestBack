const messageDao = require('../bo/messageDao');
let messageDaoInst = new messageDao();


module.exports = {

    update: function (req, res, next) {
        messageDaoInst.update(req, res, next);
    },
    get: function (req, res, next) {
        messageDaoInst.find(req, res, next);
    },
    getById: function (req, res, next) {
        messageDaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        messageDaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        messageDaoInst.delete(req, res, next);
    }
};

