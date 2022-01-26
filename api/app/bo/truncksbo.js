const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
const {default: axios} = require("axios");

class truncks extends baseModelbo {
    constructor() {
        super('truncks', 'trunck_id');
        this.baseModal = "truncks";
        this.primaryKey = 'trunck_id';
    }

}

module.exports = truncks;