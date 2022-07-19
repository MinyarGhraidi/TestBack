const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');

class Roles_crm extends baseModelbo {
    constructor() {
        super('roles_crms', 'id');
        this.baseModal = "roles_crms";
        this.primaryKey = 'id';
    }
}

module.exports = Roles_crm;