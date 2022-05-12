const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
 
class call_blundings extends baseModelbo {
    constructor() {
        super('call_blundings', 'id');
        this.baseModal = "call_blundings";
        this.primaryKey = 'id';
    }
}

module.exports = call_blundings;