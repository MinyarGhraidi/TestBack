const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');

class emails extends baseModelbo {
    constructor(){
        super('emails', 'email_id');
        this.baseModal = "emails";
        this.primaryKey = 'email_id';
    }
}

module.exports = emails;