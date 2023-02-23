
const itemAccBo  = require('../bo/accbo');
let _itemAccBo = new itemAccBo();

module.exports ={
    update: function (req, res, next) {
        _itemAccBo.update(req, res, next);
    },
    find: function (req, res, next) {
        _itemAccBo.find(req, res, next);
    },
    findById: function (req, res, next) {
        _itemAccBo.findById(req, res, next);
    },
    save: function (req, res, next) {
        _itemAccBo.save(req, res, next);
    },
    delete: function (req, res, next) {
        _itemAccBo.delete(req, res, next);
    },
    getCdrs: function (req, res, next) {
        _itemAccBo.getCdrs(req, res, next)
    },
    getSip_codes: function (req, res, next) {
        _itemAccBo.getSip_codes(req, res, next)
    },
    exportCSV: function (req, res, next){
        _itemAccBo.exportCSV(req, res, next)
    }
}
