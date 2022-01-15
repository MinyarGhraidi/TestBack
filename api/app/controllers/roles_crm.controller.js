const roles_crmDao = require('../bo/roles_crmbo');
let roles_crmDaoInst = new roles_crmDao;

module.exports = {
    update : function (req, res, next) {
        roles_crmDaoInst.update(req, res, next)
    },
    find: function (req, res, next) {
        roles_crmDaoInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        roles_crmDaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        roles_crmDaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        roles_crmDaoInst.delete(req, res, next);
    },
}