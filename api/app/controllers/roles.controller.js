const rolesDao = require('../bo/rolesbo');
let rolesDaoInst = new rolesDao;

module.exports = {
    update : function (req, res, next) {
        rolesDaoInst.update(req, res, next)
    },
    find: function (req, res, next) {
        rolesDaoInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        rolesDaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        rolesDaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        rolesDaoInst.delete(req, res, next);
    },
}