const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
 
class listcallfiles extends baseModelbo {
    constructor() {
        super('listcallfiles', 'listcallfile_id');
        this.baseModal = "listcallfiles";
        this.primaryKey = 'listcallfile_id';
    }
}

module.exports = listcallfiles;