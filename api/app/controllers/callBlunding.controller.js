const callBlundingDao = require('../bo/callBlundingbo');
let callBlundingDaoInst = new callBlundingDao;

module.exports = {
    update : function (req, res, next) {
        callBlundingDaoInst.update(req, res, next)
    },
    find: function (req, res, next) {
        callBlundingDaoInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        callBlundingDaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        callBlundingDaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        callBlundingDaoInst.delete(req, res, next);
    },
    bulkCallBlending: function (req, res, next) {
        callBlundingDaoInst.bulkCallBlending(req, res, next);
    },
    updateCallBlending: function (req, res, next) {
        callBlundingDaoInst.updateCallBlending(req, res, next);
    },
}