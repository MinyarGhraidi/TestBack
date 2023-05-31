const itembo = require('../bo/notificationsbo')
let _itembo = new itembo();

module.exports = {

    save: function (req, res, next) {
        _itembo.save(req, res, next);
    }, update: function (req, res, next) {
        _itembo.update(req, res, next);
    },
    findNotification: function (req, res, next) {
        _itembo.findNotification(req, res, next);
    },
    SaveNotification: function (req, res, next) {
        _itembo.SaveNotification(req, res, next);
    },
    updateByAccountID: function (req, res, next) {
        _itembo.updateByAccountID(req, res, next);
    },
};
