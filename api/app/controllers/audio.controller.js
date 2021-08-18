const didsDao = require('../bo/audiosbo');
let audiosDaoInst = new didsDao;

module.exports = {
    update : function (req, res, next) {
        audiosDaoInst.update(req, res, next)
    },
    find: function (req, res, next) {
        audiosDaoInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        audiosDaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        audiosDaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        audiosDaoInst.delete(req, res, next);
    },
}