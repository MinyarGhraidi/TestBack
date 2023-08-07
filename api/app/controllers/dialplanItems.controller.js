
const dialplanItemsbo  = require('../bo/dialplanItemsbo');
let _dialplanItemsbo = new dialplanItemsbo();


module.exports = {

    update: function (req, res, next) {
        _dialplanItemsbo.update(req, res, next);
    },
    find: function (req, res, next) {
        _dialplanItemsbo.find(req, res, next);
    },
    findById: function (req, res, next) {
        _dialplanItemsbo.findById(req, res, next);
    },
    save: function (req, res, next) {
        _dialplanItemsbo.save(req, res, next);
    },
    delete: function (req, res, next) {
        _dialplanItemsbo.delete(req, res, next);
    },
    getDialPlan : function (req, res, next){
        _dialplanItemsbo.getDialPlan(req, res, next)
    },
    changeStatusDialPlan : function (req, res, next){
        _dialplanItemsbo.changeStatusDialPlan(req, res, next)
    }


};

