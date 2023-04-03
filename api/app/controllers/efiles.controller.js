const efilesDao = require('../bo/efilesbo');
let efilesDaoInst = new efilesDao;

module.exports = {
    update: function (req, res, next) {
        efilesDaoInst.update(req, res, next)
    },
    find: function (req, res, next) {
        efilesDaoInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        efilesDaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        efilesDaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        efilesDaoInst.delete(req, res, next);
    },
    upload: function (req, res, next) {
        efilesDaoInst.upload(req, res, next);
    },
    getImageByStyle: function (req, res, next) {
        efilesDaoInst.getImageByStyle(req, res, next)
    },
    getListCallFiles: function (req, res, next) {
        efilesDaoInst.getListCallFiles(req, res, next)
    },

    downloadFile: function (req, res, next) {
        efilesDaoInst.downloadFile(req, res, next)
    }
}
