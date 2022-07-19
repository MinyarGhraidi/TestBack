const {baseModelbo} = require('./basebo');
class message_channel_subscriberDao extends baseModelbo {
    constructor() {
        super('message_channel_subscriberDao', 'message_channel_subscriber_id');
        this.baseModal = 'message_channel_subscriberDao';
        this.primaryKey = 'message_channel_subscriber_id';
    }

}

module.exports = message_channel_subscriberDao;
