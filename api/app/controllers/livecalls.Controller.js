const livecallsDao = require('../bo/livecallsbo');
let livecallsDaoInst = new livecallsDao;

module.exports = {
    update : function (req, res, next) {
        livecallsDaoInst.update(req, res, next)
    },
    find: function (req, res, next) {
        livecallsDaoInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        livecallsDaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        livecallsDaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        livecallsDaoInst.delete(req, res, next);
    },
    getLiveCallsByCallId: function (req, res, next) {
        livecallsDaoInst.getLiveCallsByCallId(req, res, next);
    },
    getLiveCallsByAccount: function (req, res, next) {
        livecallsDaoInst.getLiveCallsByAccount(req, res, next);
    },
    getLiveCallsByCampaign: function (req, res, next) {
        livecallsDaoInst.getLiveCallsByCampaign(req, res, next);
    },
}