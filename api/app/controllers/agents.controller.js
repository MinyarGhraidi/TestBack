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

    saveAgent: function (req, res, next) {
        agentsDaoInst.saveUserAgent(req, res, next)
    },
    changeStatus: function(req,res,next){
        agentsDaoInst.changeStatus(req,res,next)
    },
    updateAgent: function (req, res, next) {
        agentsDaoInst.updateAgent(req, res, next)
    },
    updateSipDeviceUser: function (req, res, next) {
        agentsDaoInst.updateSipDeviceUser(req, res, next)
    },
    deleteAgent: function (req, res, next) {
        agentsDaoInst.deleteAgent(req, res, next)
    },
    onConnect: function (req, res, next) {
        agentsDaoInst.onConnect(req, res, next)
    },
    disconnectTelco: function (req, res, next) {
        agentsDaoInst.disconnectTelco(req, res, next)
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
    logoutAgent: function (req, res, next) {
        agentsDaoInst.logoutAgent(req, res, next)
    },
    disconnectAgentsByAccountID: function (req, res, next) {
        agentsDaoInst.disconnectAgentsByAccountID(req, res, next)
    },
    agentDetailsReports: function (req, res, next) {
        agentsDaoInst.agentDetailsReports(req, res, next)
    },
    agentCallReports: function (req, res, next) {
        agentsDaoInst.agentCallReports(req, res, next)
    },
    listCallFileReports: function (req, res, next) {
        agentsDaoInst.listCallFileReports(req, res, next)
    },
    pauseStatusReports: function (req, res, next) {
        agentsDaoInst.pauseStatusReports(req, res, next)
    },
    vmdReports: function (req, res, next) {
        agentsDaoInst.vmdReports(req, res, next)
    },
    changeCrmStatus : function (req, res, next) {
        agentsDaoInst.changeCrmStatus(req, res, next)
    },
    callInQueue: function (req, res, next){
        agentsDaoInst.callInQueue(req, res, next)
    },
    getUserBySIP_Username: function (req, res, next){
        agentsDaoInst.getUserBySIP_Username(req, res, next)
    }
}
