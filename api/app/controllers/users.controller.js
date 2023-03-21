const usersDao = require('../bo/usersbo');
let _itembo = new usersDao;

module.exports = {
    update: function (req, res, next) {
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
    signIn: function (req, res, next) {
        _itembo.signIn(req, res, next)
    },
    getUserByToken: function (req, res, next) {
        _itembo.getUserByToken(req, res, next);
    },
    verifyToken: function (req, res, next) {
        _itembo.verifyToken(req, res, next)
    },
    saveUser: function (req, res, next) {
        _itembo.saveUser(req, res, next)
    },
    validPassword: function (req, res, next) {
        _itembo.validPassword(req, res, next)
    },
    switchToNewAccount: function (req, res, next) {
        _itembo.switchToNewAccount(req, res, next)
    },
    generatedUniqueUsername: function (req, res, next) {
        _itembo.generatedUniqueUsername(req, res, next)
    },
    getSalesByAgent: function (req, res, next) {
        _itembo.getSalesByAgent(req, res, next)
    },
    deleteSalesRepresentative: function (req, res, next) {
        _itembo.deleteSalesRepresentative(req, res, next)
    },
    assignAgentsToSales: function (req, res, next) {
        _itembo.assignAgentsToSales(req, res, next)
    },
    getDataAgent: function (req, res, next) {
        _itembo.getDataAgent(req, res, next)
    },
    cloneSales: function (req, res, next) {
        _itembo.cloneSales(req, res, next)
    },
    updateAcc: function (req,res,next){
        _itembo.updateAcc(req,res,next)
    },
    GenerateUserNameFromLastUser : function (req,res,next){
        _itembo.GenerateUserNameFromLastUser(req,res,next)
    }


}
