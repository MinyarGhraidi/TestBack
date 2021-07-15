const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');

class campaigns extends baseModelbo {
    constructor(){
        super('campaigns', 'campaign_id');
        this.baseModal = "campaigns";
        this.primaryKey = 'campaign_id';
    }
}

module.exports = campaigns;