const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
const Op = sequelize.Op;
let db = require('../models');
const {appSecret} = require("../helpers/app");
const jwt = require('jsonwebtoken');

class dialplanbo extends baseModelbo {
    constructor() {
        super('dialplans', 'dialplan_id');
        this.baseModal = 'dialplans';
        this.primaryKey = 'dialplan_id';
    }

}

module.exports = dialplanbo;
