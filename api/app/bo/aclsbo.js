const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');

class Aclsbo extends baseModelbo {
    constructor() {
        super('acls', 'id');
        this.baseModal = "acls";
        this.primaryKey = 'id';
    }
}

module.exports = Aclsbo;