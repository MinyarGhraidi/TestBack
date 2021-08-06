const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
 
class pausestatus extends baseModelbo {
    constructor() {
        super('pausestatuses', 'pausestatus_id');
        this.baseModal = "pausestatuses";
        this.primaryKey = 'pausestatus_id';
    }
}

module.exports = pausestatus;