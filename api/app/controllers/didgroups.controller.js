const didsGroupsDao = require('../bo/didsgroupsbo');
let didsDaoGroupsInst = new didsGroupsDao;

module.exports = {
    update : function (req, res, next) {
        didsDaoGroupsInst.update(req, res, next)
    },
    find: function (req, res, next) {
        didsDaoGroupsInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        didsDaoGroupsInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        didsDaoGroupsInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        didsDaoGroupsInst.delete(req, res, next);
    },
    affectDidsGpToCamp: function (req, res, next) {
        didsDaoGroupsInst.affectDidsGpToCamp(req, res, next);
    },
    changeStatus: function (req, res, next) {
        didsDaoGroupsInst.changeStatusCascade(req, res, next);
    },
    deleteCascade: function (req, res, next) {
        didsDaoGroupsInst.deleteCascade(req, res, next);
    },
}