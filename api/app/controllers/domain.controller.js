const domainsDao = require('../bo/domainbo');
let _domainsDao = new domainsDao();

module.exports = {

    saveDomain: function (req, res, next) {
        _domainsDao.saveDomain(req, res, next);
    },
    find: function (req, res, next) {
        _domainsDao.find(req, res, next);
    },
    updateDomain: function (req, res, next) {
        _domainsDao.updateDomain(req, res, next);
    },
    findByIdDomain: function (req, res, next) {
        _domainsDao.findByIdDomain(req, res, next);
    },
    deleteDomain: function (req, res, next) {
        _domainsDao.deleteDomain(req, res, next);
    }

};

