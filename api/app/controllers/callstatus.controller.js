const callstatusDao = require('../bo/callstatusbo');
let callstatusDaoInst = new callstatusDao;

module.exports = {
    update : function (req, res, next) {
        callstatusDaoInst.update(req, res, next)
    },
    find: function (req, res, next) {
        callstatusDaoInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        callstatusDaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        callstatusDaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        callstatusDaoInst.delete(req, res, next);
    },
    changeStatus:function (req, res, next) {
        callstatusDaoInst.changeStatus(req, res, next)
    }
}
