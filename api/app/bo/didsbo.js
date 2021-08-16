const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
 
class dids extends baseModelbo {
    constructor() {
        super('dids', 'did_id');
        this.baseModal = "dids";
        this.primaryKey = 'did_id';
    }
}

module.exports = dids;