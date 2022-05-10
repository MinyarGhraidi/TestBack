const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
 
class didsgroups extends baseModelbo {
    constructor() {
        super('didsgroups', 'did_id');
        this.baseModal = "didsgroups";
        this.primaryKey = 'did_id';
    }
}

module.exports = didsgroups;