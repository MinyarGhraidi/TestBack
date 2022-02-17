const meetingsDao = require('../bo/meetingsbo');
let meetingsDaoInst = new meetingsDao;

module.exports = {
    update : function (req, res, next) {
        meetingsDaoInst.update(req, res, next)
    },
    find: function (req, res, next) {
        meetingsDaoInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        meetingsDaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        meetingsDaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        meetingsDaoInst.delete(req, res, next);
    },
    getAvailableSales: function (req, res, next) {
        meetingsDaoInst.getAvailableSales(req, res, next);
    },
    saveMeetings: function (req, res, next) {
        meetingsDaoInst.saveMeetings(req, res, next);
    },
    authorize: function (req, res, next) {
        meetingsDaoInst.authorize(req, res, next)
    },
    deleteMeetingNotAssigned: function (req, res, next) {
        meetingsDaoInst.deleteMeetingNotAssigned(req, res, next)
    },
}