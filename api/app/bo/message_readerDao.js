const {baseModelbo} = require('./basebo');
class message_readerDao extends baseModelbo {
    constructor() {
        super('message_readers', 'message_reader_id');
        this.baseModal = 'message_readers';
        this.primaryKey = 'message_reader_id';
    }

}

module.exports = message_readerDao;
