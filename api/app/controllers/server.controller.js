const serversDAO = require('../bo/serverbo');
let _serverDAO = new serversDAO;

module.exports = {
    editServer : function (req, res, next) {
        _serverDAO.editServer(req, res, next)
    },
    find: function (req, res, next) {
        _serverDAO.find(req, res, next);
    },
    findById: function (req, res, next) {
        _serverDAO.findById(req, res, next);
    },
    addServer: function (req, res, next) {
        _serverDAO.addServer(req, res, next);
    },
    deleteServer: function (req, res, next) {
        _serverDAO.deleteServer(req, res, next);
    },
}