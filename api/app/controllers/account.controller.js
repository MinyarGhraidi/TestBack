
const itembo  = require('../bo/accountsbo');
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
    signIn: function (req, res, next) {
        _itembo.signIn(req, res, next);
    },
    getAccountByToken: function (req, res, next) {
        _itembo.getAccountByToken(req, res, next);
    },
    AddEditAccount : function (req, res, next) {
        _itembo.AddEditAccount(req, res, next)
    }
   

};

