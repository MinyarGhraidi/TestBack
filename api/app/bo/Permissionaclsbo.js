const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');

class Permissionaclsbo extends baseModelbo {
    constructor() {
        super('permission_acls', 'id');
        this.baseModal = "permission_acls";
        this.primaryKey = 'id';
    }


}

module.exports = Permissionaclsbo;