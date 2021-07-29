const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
 
class efiles extends baseModelbo {
    constructor() {
        super('efiles', 'file_id');
        this.baseModal = "efiles";
        this.primaryKey = 'file_id';
    }
}

module.exports = efiles;