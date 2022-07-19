const agent_log_eventsDao = require('../bo/agent_log_eventsbo');
let agent_log_eventsDaoInst = new agent_log_eventsDao;

module.exports = {
    update : function (req, res, next) {
        agent_log_eventsDaoInst.update(req, res, next)
    },
    find: function (req, res, next) {
        agent_log_eventsDaoInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        agent_log_eventsDaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        agent_log_eventsDaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        agent_log_eventsDaoInst.delete(req, res, next);
    },
    getLastEvent: function (req, res, next) {
        agent_log_eventsDaoInst.getLastEvent(req, res, next);
    },
}