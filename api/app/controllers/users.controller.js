const usersDao = require('../bo/usersbo');
let usersDaoInst = new usersDao ; 

module.exports = {
    update : function (req, res, next) {
        usersDaoInst.update(req, res, next)
    },
    find: function (req, res, next) {
        usersDaoInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        usersDaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        usersDaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        usersDaoInst.delete(req, res, next);
    },
    signUp: function (req, res, next) {
        usersDaoInst.signUp(req, res, next)
    },
    signIn: function (req, res, next) {
        usersDaoInst.signIn(req, res, next)
    }
}