const templateDao = require('../bo/templateListbo');
let _itembo = new templateDao;

module.exports ={
    save: function (req, res, next) {
        _itembo.save(req, res, next);
    },
    find: function (req, res, next) {
        _itembo.find(req, res, next);
    },
    findById: function (req, res, next) {
        _itembo.findById(req, res, next);
    },
    delete: function (req, res, next) {
        _itembo.delete(req, res, next)
    },
    update: function (req, res, next) {
        _itembo.update(req, res, next)
    },
    changeStatus : function (req, res, next) {
        _itembo.changeStatus(req, res, next)
    },
    deleteTemplate : function (req, res, next) {
        _itembo.deleteTemplate(req, res, next)
    },
}
