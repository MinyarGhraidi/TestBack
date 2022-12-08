const {baseModelbo} = require('./basebo');

class dialplanItemsbo extends baseModelbo {
    constructor() {
        super('dialplan_items', 'dialplan_item_id');
        this.baseModal = 'dialplan_items';
        this.primaryKey = 'dialplan_item_id';
    }

}

module.exports = dialplanItemsbo;
