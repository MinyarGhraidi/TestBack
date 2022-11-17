const aclsDao = require('../bo/aclbo');
let _aclsDao = new aclsDao();

module.exports = {

    find: function (req, res, next) {
        _aclsDao.find(req, res, next);
    },
    saveAcl: function (req, res, next) {
        _aclsDao.saveAcl(req, res, next);
    },
    updateAcl: function (req, res, next) {
        _aclsDao.updateAcl(req, res, next);
    },
    deleteAcl: function (req, res, next) {
        _aclsDao.deleteAcl(req, res, next);
    }
};