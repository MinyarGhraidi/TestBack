const itembo = require('../bo/ivr_menubo');
let _itembo = new itembo();


module.exports ={
    updateIVR: function (req, res, next) {
        _itembo.update(req, res, next);
    },
    find: function (req, res, next) {
        _itembo.find(req, res, next);
    },
    findById: function (req, res, next) {
        _itembo.findById(req, res, next);
    },
    saveIVR: function (req, res, next) {
        _itembo.save(req, res, next);
    },
    deleteIVR: function (req, res, next) {
        _itembo.delete(req, res, next);
    },
    findByCID: function (req, res, next){
        _itembo.findByCampaignId(req, res, next);
    }
}