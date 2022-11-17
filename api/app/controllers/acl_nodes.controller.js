const aclNodesDao = require('../bo/aclNodesbo');
let _aclNodesDao = new aclNodesDao();

module.exports = {

    find: function (req, res, next) {
        _aclNodesDao.find(req, res, next);
    },
    saveAclNode: function (req, res, next) {
        _aclNodesDao.saveAclNode(req, res, next);
    },
    updateAclNode: function (req, res, next) {
        _aclNodesDao.updateAclNode(req, res, next);
    },
    deleteAclNode: function (req, res, next) {
        _aclNodesDao.deleteAclNode(req, res, next);
    }
};