const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
const Op = sequelize.Op;
let db = require('../models');
const { appSecret} = require("../helpers/app");
const jwt = require('jsonwebtoken');

class rategroups extends baseModelbo {
    constructor() {
        super('rategroups', 'rategroup_id');
        this.baseModal = 'rategroups';
        this.primaryKey = 'rategroup_id';
    }
}

module.exports = rategroups;
