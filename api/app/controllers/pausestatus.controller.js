const pausestatusDao = require('../bo/pausestatusbo');
let pausestatusDaoInst = new pausestatusDao;

module.exports = {
    update : function (req, res, next) {
        pausestatusDaoInst.update(req, res, next)
    },
    find: function (req, res, next) {
        pausestatusDaoInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        pausestatusDaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        pausestatusDaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        pausestatusDaoInst.delete(req, res, next);
    },
    findByCampaignId: function (req, res, next) {
        pausestatusDaoInst.findByCampaignId(req, res, next);
    },
    findByCampIdsAndSystem: function (req, res, next) {
        pausestatusDaoInst.findByCampIdsAndSystem(req, res, next);
    },
}