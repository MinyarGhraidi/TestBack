const itembo  = require('../bo/campaignbo');
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
    saveCampaign: function (req, res, next) {
        _itembo.saveCampaign(req, res, next);
    },
    updateCampaign: function (req, res, next) {
        _itembo.updateCampaign(req, res, next);
    },
    cloneCampaign: function (req, res, next) {
        _itembo.cloneCampaign(req, res, next);
    },
    addDefaultPauseCallStatus: function (req, res, next) {
        _itembo.addDefaultPauseCallStatus(req, res, next);
    },
    deleteCampaign: function (req, res, next) {
        _itembo.deleteCampaign(req, res, next);
    },
};
