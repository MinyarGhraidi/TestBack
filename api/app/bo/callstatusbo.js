const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
 
class callstatus extends baseModelbo {
    constructor() {
        super('callstatuses', 'callstatus_id');
        this.baseModal = "callstatuses";
        this.primaryKey = 'callstatus_id';
    }
}

module.exports = callstatus;