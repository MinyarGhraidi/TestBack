const message_channelDao = require('../bo/message_channelDao');
let message_channelDaoInst = new message_channelDao();


module.exports = {

    update: function (req, res, next) {
        message_channelDaoInst.update(req, res, next);
    },
    get: function (req, res, next) {
        message_channelDaoInst.find(req, res, next);
    },
    getById: function (req, res, next) {
        message_channelDaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        message_channelDaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        message_channelDaoInst.delete(req, res, next);
    },
    createNewChannel : function (req, res, next) {
        message_channelDaoInst.createNewChannel(req, res , next)
    },
    sendNewMessage : function (req, res, next) {
        message_channelDaoInst.sendNewMessage(req, res, next)
    },
    getMyChannel: function ( req, res, next){
        message_channelDaoInst.getMyChannel(req, res, next)
    },
    getContactsChannel: function ( req, res, next){
        message_channelDaoInst.getContactsChannel(req, res, next)
    },
    getAllUsersChannel: function ( req, res, next){
        message_channelDaoInst.getAllUsersChannel(req, res, next)
    },
    getChannelMessages: function (req, res, next){
        message_channelDaoInst.getChannelMessages(req, res, next)
    },
    updateMessageChannelSubscribes: function (req, res, next){
        message_channelDaoInst.updateMessageChannelSubscribes(req, res, next)
    },
    addSubscribersToChannel: function (req, res, next) {
        message_channelDaoInst.addSubscribersToChannel(req, res, next)
    }
};
