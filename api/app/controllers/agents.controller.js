const agentsDao = require('../bo/agentsbo');
let agentsDaoInst = new agentsDao ; 

module.exports = {
    update : function (req, res, next) {
        agentsDaoInst.update(req, res, next)
    },
    find: function (req, res, next) {
        agentsDaoInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        agentsDaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        agentsDaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        agentsDaoInst.delete(req, res, next);
    },
    signUp: function (req, res, next) {
        agentsDaoInst.signUp(req, res, next)
    },
    signIn: function (req, res, next) {
        agentsDaoInst.signIn(req, res, next)
    }
}