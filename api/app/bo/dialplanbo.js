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
    changeStatusForEntities(entities, dialplan_id, status) {
        let indexEntities = 0;
        return new Promise((resolve, reject) => {
            entities.map(dbs => {
                this.db[dbs].update({status: status, updated_at: new Date()}, {
                    where: {
                        dialplan_id: dialplan_id,
                        active: 'Y'
                    }
                }).then(() => {
                    if (indexEntities < entities.length - 1) {
                        indexEntities++;
                    } else {
                        resolve(true);
                    }
                }).catch(err => {
                    reject(err);
                });


            });
        })
    }
    changeStatusDialPlan(dialplan_id, status) {
        return new Promise((resolve, reject) => {
            const UpdateEntities = ['dialplan_items','dialplans'];
            this.changeStatusForEntities(UpdateEntities, dialplan_id, status).then(() => {
                resolve(true);
            }).catch(err => {
                return reject(err);
            });

        })
    }
    changeStatus(req, res, next) {
        let _this = this;
        let {dialplan_id, status} = req.body;
        if ((!!!dialplan_id || !!!status)) {
            return this.sendResponseError(res, ['Error.RequestDataInvalid'], 0, 403);
        }
        if (status !== 'N' && status !== 'Y') {
            return this.sendResponseError(res, ['Error.StatusMustBe_Y_Or_N'], 0, 403);
        }
        this.db['dialplans'].findOne({where: {dialplan_id: dialplan_id, active: 'Y'}})
            .then(dialPlan => {
                console.log(dialPlan)
                if (dialPlan) {
                    this.changeStatusDialPlan(dialplan_id, status).then(() => {
                        res.send({
                            status: 200,
                            message: "success"
                        })
                    }).catch((err)=>{
                        return _this.sendResponseError(res, ['cannot update dialplan', err], 1, 403);
                    })
                }else {
                    return _this.sendResponseError(res, ['Dialplan not found'], 1, 403);
                }
            }).catch(err => {
            return _this.sendResponseError(res, ['cannot fetch dialplan', err], 1, 403);
        })


    }

}

module.exports = dialplanbo;
