const aclDao = require('../bo/Permissionaclsbo');
let acl_DaoInst = new aclDao;

module.exports = {
    update : function (req, res, next) {
        acl_DaoInst.update(req, res, next)
    },
    find: function (req, res, next) {
        acl_DaoInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        acl_DaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        acl_DaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        acl_DaoInst.delete(req, res, next);
    },
}