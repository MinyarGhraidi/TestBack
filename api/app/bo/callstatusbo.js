const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
 
class callstatus extends baseModelbo {
    constructor() {
        super('callstatuses', 'callstatus_id');
        this.baseModal = "callstatuses";
        this.primaryKey = 'callstatus_id';
    }

    alterFindById(entityData) {
        return new Promise((resolve, reject) => {
            resolve(entityData);
        });
    }

    setRequest(req) {
        this.request = req;
    }

    setResponse(res) {
        this.response = res;
    }

}

module.exports = callstatus;