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

    changeStatus(req, res, next) {
        let user_id = req.body.user_id;
        let action = req.body.action;

        this.db['agent_log_events'].update({
                finish_at: new Date()
            },
            {
                where: {
                    user_id: user_id
                },
                order: [['start_at', 'DESC']],
                limit: 1,
                returning: true,
                plain: true
            }
        ).then(last_action => {
            this.db['agent_log_events'].build({
                user_id: user_id,
                action_name: action,
                created_at: new Date(),
                start_at: last_action[1].finish_at
            }).save().then(agent_event=>{
                res.send({
                    success: true,
                    data: agent_event
                })

            }).catch(err=>{
                return this.sendResponseError(res, ['Error', err], 1, 403);
            })
        }).catch(err=>{
            return this.sendResponseError(res, ['Error', err], 1, 403);
        })


    }


}

module.exports = callstatus;
