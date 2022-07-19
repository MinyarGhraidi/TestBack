const {baseModelbo} = require('./basebo');
class userIndexsDao extends baseModelbo {
    constructor() {
        super('user_data_indexs', 'user_data_index_id');
        this.baseModal = 'user_data_indexs';
        this.primaryKey = 'user_data_index_id';
    }
}

module.exports = userIndexsDao;
