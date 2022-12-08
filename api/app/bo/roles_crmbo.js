const {baseModelbo} = require('./basebo');

class Roles_crm extends baseModelbo {
    constructor() {
        super('roles_crms', 'id');
        this.baseModal = "roles_crms";
        this.primaryKey = 'id';
    }
}

module.exports = Roles_crm;