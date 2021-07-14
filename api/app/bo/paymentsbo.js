const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
const Op = sequelize.Op;
let db = require('../models');
const config = require('../config/config.json');

class payments extends baseModelbo {
    constructor() {
        super('payments', 'payment_id');
        this.baseModal = 'payments';
        this.primaryKey = 'payment_id';
    }
  
}

module.exports = payments;
