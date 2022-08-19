const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
const Op = sequelize.Op;
let db = require('../models');
const {appSecret} = require("../helpers/app");
const jwt = require('jsonwebtoken');

class dialplanItemsbo extends baseModelbo {
    constructor() {
        super('dialplan_items', 'dialplan_item_id');
        this.baseModal = 'dialplan_items';
        this.primaryKey = 'dialplan_item_id';
    }

}

module.exports = dialplanItemsbo;
