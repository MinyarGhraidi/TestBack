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

}
