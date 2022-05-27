const {baseModelbo} = require('./basebo');
class messageDao extends baseModelbo {
    constructor() {
        super('messages', 'message_id');
        this.baseModal = 'messages';
        this.primaryKey = 'message_id';
    }




}

module.exports = messageDao;
