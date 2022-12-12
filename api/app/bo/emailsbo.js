const {baseModelbo} = require('./basebo');

class emails extends baseModelbo {
    constructor(){
        super('emails', 'email_id');
        this.baseModal = "emails";
        this.primaryKey = 'email_id';
    }
}

module.exports = emails;