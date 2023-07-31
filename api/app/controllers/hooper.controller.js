const hooperDao = require('../bo/hooperbo');
let hooperInst = new hooperDao;

module.exports = {
    update : function (req, res, next) {
        hooperInst.update(req, res, next)
    },
    find: function (req, res, next) {
        hooperInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        hooperInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        hooperInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        hooperInst.delete(req, res, next);
    },
    findHooper: function (req, res, next) {
        hooperInst.findHooper(req, res, next);
    },
}
