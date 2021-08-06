const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');

class callfiles extends baseModelbo {
    constructor(){
        super('callfiles', 'callfile_id');
        this.baseModal = "callfiles";
        this.primaryKey = 'callfile_id';
    }
}

module.exports = callfiles;