const remDao = require('../bo/reminderbo');
let rem_DaoInst = new remDao;

module.exports = {
    update : function (req, res, next) {
        rem_DaoInst.update(req, res, next)
    },
    find: function (req, res, next) {
        rem_DaoInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        rem_DaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        rem_DaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        rem_DaoInst.delete(req, res, next);
    },
    findAllReminders: function (req, res, next) {
        rem_DaoInst.findAllReminders(req, res, next);
    },
}
