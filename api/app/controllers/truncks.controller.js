const truncksDao = require('../bo/truncksbo');
let truncksDaoInst = new truncksDao;

module.exports = {
    update : function (req, res, next) {
        truncksDaoInst.update(req, res, next)
    },
    find: function (req, res, next) {
        truncksDaoInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        truncksDaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        truncksDaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        truncksDaoInst.delete(req, res, next);
    },
}