
const itemDialplanBo  = require('../bo/dialplanbo');
let _itemDialplanBo = new itemDialplanBo();


module.exports = {

    update: function (req, res, next) {
        _itemDialplanBo.update(req, res, next);
    },
    find: function (req, res, next) {
        _itemDialplanBo.find(req, res, next);
    },
    findById: function (req, res, next) {
        _itemDialplanBo.findById(req, res, next);
    },
    save: function (req, res, next) {
        _itemDialplanBo.save(req, res, next);
    },
    delete: function (req, res, next) {
        _itemDialplanBo.delete(req, res, next);
    },
   

};

