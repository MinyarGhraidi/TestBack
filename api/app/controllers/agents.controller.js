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
    },
    saveAgent: function (req, res, next) {
        agentsDaoInst.saveUserAgent(req, res, next)
    },
    changeStatus: function(req,res,next){
        agentsDaoInst.changeStatus(req,res,next)
    },
    updateAgent: function (req, res, next) {
        agentsDaoInst.updateAgent(req, res, next)
    },
    deleteAgent: function (req, res, next) {
        agentsDaoInst.deleteAgent(req, res, next)
    },
    onConnect: function (req, res, next) {
        agentsDaoInst.onConnect(req, res, next)
    },
    getConnectedAgents: function (req, res, next) {
        agentsDaoInst.getConnectedAgents(req, res, next)
    },
    filterDashboard: function (req, res, next) {
        agentsDaoInst.filterDashboard(req, res, next)
    },
    onDisconnectAgents: function (req, res, next) {
        agentsDaoInst.onDisconnectAgents(req, res, next)
    },
    agentDetailsReports: function (req, res, next) {
        agentsDaoInst.agentDetailsReports(req, res, next)
    },
    agentCallReports: function (req, res, next) {
        agentsDaoInst.agentCallReports(req, res, next)
    },
    listCallFileReports: function (req, res, next) {
        agentsDaoInst.listCallFileReports(req, res, next)
    }
}
