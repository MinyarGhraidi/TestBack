const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
 
class audios extends baseModelbo {
    constructor() {
        super('audios', 'audio_id');
        this.baseModal = "audios";
        this.primaryKey = 'audio_id';
    }
}

module.exports = audios;