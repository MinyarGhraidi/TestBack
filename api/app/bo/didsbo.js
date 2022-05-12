const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
 
class dids extends baseModelbo {
    constructor() {
        super('dids', 'id');
        this.baseModal = "dids";
        this.primaryKey = 'id';
    }
}

module.exports = dids;