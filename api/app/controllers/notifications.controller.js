const itembo = require('../bo/notificationsbo')
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
    SaveNotification: function (req, res, next) {
        _itembo.SaveNotification(req, res, next);
    },

};