const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');

class lookups extends baseModelbo {
    constructor(){
        super('lookups', 'lookups_id');
        this.baseModal = "lookups";
        this.primaryKey = 'lookups_id';
    }
}

module.exports = lookups;