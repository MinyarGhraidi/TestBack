const usersDao = require('../bo/usersbo');
let _itembo = new usersDao ; 

module.exports = {
    update : function (req, res, next) {
        _itembo.update(req, res, next)
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
    signUp: function (req, res, next) {
        _itembo.signUp(req, res, next)
    },
    signIn: function (req, res, next) {
        _itembo.signIn(req, res, next)
    },
    getUserByToken: function (req, res, next) {
        _itembo.getUserByToken(req, res, next);
    },
}