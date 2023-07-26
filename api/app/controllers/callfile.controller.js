const itembo  = require('../bo/callfilebo');
let _itembo = new itembo();


module.exports = {

    update: function (req, res, next) {
        _itembo.update(req, res, next);
    },
    find: function (req, res, next) {
        _itembo.find(req, res, next);
    },
    findById: function (req, res, next) {
        _itembo.findById(req, res, next);
    },
    save: function (req, res, next) {
        _itembo.save(req, res, next);
    },
    delete: function (req, res, next) {
        _itembo.delete(req, res, next);
    },
    updateCallFileQualification :function (req, res, next){
        _itembo.updateCallFileQualification(req,res,next)
    },
    leadsStats :function (req, res, next){
        _itembo.leadsStats(req,res,next)
    },
    leadsStatsExport :function (req, res, next){
        _itembo.leadsStatsExport(req,res,next)
    },
    getHistoryCallFile :function (req, res, next){
        _itembo.getHistoryCallFile(req,res,next)
    },
    getEntityRevisionByModelId: function (req, res, next) {
        _itembo.model_history(req, res, next)
    },
    playMediaMusic: function (req, res, next) {
        _itembo.playMediaMusic(req, res, next)
    },
    getCustomFields : function (req,res,next){
        _itembo.getCustomFields(req,res,next)
    },
    findCallFile: function (req, res, next){
        _itembo.findCallFile(req, res, next)
    },
    RecycleCallFile: function (req, res, next){
        _itembo.RecycleCallFile(req, res, next)
    },
    getCallBlending: function (req, res, next){
        _itembo.getCallBlending(req, res, next)
    },
    eavesdrop : function (req, res, next){
        _itembo.eavesdrop(req, res, next)
    },
    getCFListsByIDList : function (req, res, next){
        _itembo.getCFListsByIDList(req, res, next)
    }

};
