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
    deleteCascade: function (req, res, next) {
        listcallfilesDaoInst.deleteCascade(req, res, next);
    },
    delete: function (req, res, next) {
        listcallfilesDaoInst.delete(req, res, next);
    },
    getStatsListCallFiles : function (req, res, next) {
        listcallfilesDaoInst.getStatsListCallFiles(req, res, next)
    },
    CallFileQualification: function (req, res, next){
        listcallfilesDaoInst.CallFileQualification(req, res, next)
    },
    downloadList: function (req, res, next){
        listcallfilesDaoInst.downloadList(req, res, next)
    },
    cloneListCallFiles : function (req, res, next) {
        listcallfilesDaoInst.cloneListCallFiles(req, res, next)
    },
    getStatsListCallFileCallStatus : function (req, res, next) {
        listcallfilesDaoInst.getStatsListCallFileCallStatus(req, res, next)
    },
    getStatsListCallFileCallStatusCampaign : function (req, res, next) {
        listcallfilesDaoInst.getStatsListCallFileCallStatusCampaign(req, res, next)
    },
    changeStatus : function (req, res, next) {
        listcallfilesDaoInst.changeStatus(req, res, next)
    },

}
