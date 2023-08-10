const didsDao = require('../bo/didsbo');
let didsDaoInst = new didsDao;

module.exports = {
    update : function (req, res, next) {
        didsDaoInst.update(req, res, next)
    },
    find: function (req, res, next) {
        didsDaoInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        didsDaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        didsDaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        didsDaoInst.delete(req, res, next);
    },
    saveBulk: function (req, res, next) {
        didsDaoInst.saveBulk(req, res, next);
    },
    deleteDiD: function (req, res, next) {
        didsDaoInst.deleteDiD(req, res, next)
    }
}
