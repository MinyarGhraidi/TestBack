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
    CallFilesMapping : function (req, res,next){
        _itembo.CallFilesMapping(req, res, next)
    },
    saveListCallFile: function (req, res, next){
        _itembo.saveListCallFile(req, res, next)
    },
    updateCallFileQualification :function (req, res, next){
        _itembo.updateCallFileQualification(req,res,next)
    },
    leadsStats :function (req, res, next){
        _itembo.leadsStats(req,res,next)
    },
    getHistoryCallFile :function (req, res, next){
        _itembo.getHistoryCallFile(req,res,next)
    },

};
