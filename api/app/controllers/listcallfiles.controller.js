const listcallfilesDao = require('../bo/listcallfilesbo');
let listcallfilesDaoInst = new listcallfilesDao;

module.exports = {
    update : function (req, res, next) {
        listcallfilesDaoInst.update(req, res, next)
    },
    find: function (req, res, next) {
        listcallfilesDaoInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        listcallfilesDaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        listcallfilesDaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        listcallfilesDaoInst.delete(req, res, next);
    },
    getStatsListCallFiles : function (req, res, next) {
        listcallfilesDaoInst.getStatsListCallFiles(req, res, next)
    },
    cloneListCallFiles : function (req, res, next) {
        listcallfilesDaoInst.cloneListCallFiles(req, res, next)
    },

}
