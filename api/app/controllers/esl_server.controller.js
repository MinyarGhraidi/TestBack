const serversDAO = require('../bo/esl_serverbo');
let _serverDAO = new serversDAO;

module.exports = {
    find: function (req, res, next) {
        _serverDAO.find(req, res, next);
    },
    findById: function (req, res, next) {
        _serverDAO.findById(req, res, next);
    },
    addEslServer: function (req, res, next) {
        _serverDAO.addEslServer(req, res, next);
    },
    editEslServer : function (req, res, next) {
        _serverDAO.editEslServer(req, res, next)
    },
    deleteEslServer : function (req, res, next) {
        _serverDAO.deleteEslServer(req, res, next)
    },
    changeStatusServer : function (req, res, next) {
        _serverDAO.changeStatusServer(req, res, next)
    },

}