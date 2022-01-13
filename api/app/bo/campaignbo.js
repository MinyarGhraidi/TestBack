const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
const {default: axios} = require("axios");

const call_center_token = require(__dirname + '/../config/config.json')["call_center_token"];
const base_url_cc_kam = require(__dirname + '/../config/config.json')["base_url_cc_kam"];
const call_center_authorization = {
    headers: {Authorization: call_center_token}
};


class campaigns extends baseModelbo {
    constructor() {
        super('campaigns', 'campaign_id');
        this.baseModal = "campaigns";
        this.primaryKey = 'campaign_id';
    }


    saveInbound(req, res, next) {
        let values = req.body;
        let {queue} = values.params;
        let params = values.params;
        let {greetings, hold_music} = queue;
        queue.greetings = ["http://myTestServer/IVRS/" + greetings];
        queue.hold_music = ["http://myTestServer/IVRS/" + hold_music];
        axios
            .post(`${base_url_cc_kam}api/v1/queues`, queue, call_center_authorization)
            .then((result) => {
                let {uuid} = result.data.queue;
                queue.uuid = uuid;
                queue.greetings = greetings;
                queue.hold_music = hold_music;
                params.queue = queue;
                delete values.params;
                values.params = params;
                let modalObj = this.db['campaigns'].build(values);
                modalObj.save()
                    .then((response) => {

                        let promise_callStatus = new Promise((resolve, reject) => {
                            let index_callstatus = 0;
                            this.getLookupsByType("DEFAULTCALLSTATUS")
                                .then((data) => {
                                    if(data && data.length !== 0) {
                                        data.forEach((el) => {
                                            let obj = {};
                                            obj.code = el.key;
                                            obj.label = el.value.name;
                                            obj.isDefault = "Y";
                                            obj.campaign_id = campaign_id;
                                            let modalObj = this.db['callstatuses'].build(obj)
                                            modalObj
                                                .save()
                                                .then(response => {
                                                    if (index_callstatus < data.length - 1) {
                                                        index_callstatus++;
                                                    } else {
                                                        resolve(true);
                                                    }
                                                })
                                                .catch((err) => {
                                                    reject(false)
                                                });
                                        });
                                    } else {
                                        resolve(true)
                                    }
                                })
                                .catch((err) => {
                                    reject(false)
                                });
                        });

                        let promise_pauseStatus = new Promise((resolve, reject) => {
                            let index_pausestatus = 0;
                            this.getLookupsByType("DEFAULTPAUSESTATUS")
                                .then((data) => {
                                    if(data && data.length !== 0) {
                                        data.forEach((el) => {
                                            let obj = {};
                                            obj.code = el.key;
                                            obj.label = el.value.name;
                                            obj.isDefault = "Y";
                                            obj.campaign_id = campaign_id;
                                            let modalObj = this.db['pausestatuses'].build(obj)
                                            modalObj
                                                .save()
                                                .then(result => {
                                                    if (index_pausestatus < data.length - 1) {
                                                        index_pausestatus++;
                                                    } else {
                                                        resolve(true);
                                                    }
                                                })
                                                .catch((err) => {
                                                    reject(false);
                                                });
                                        });
                                    } else {
                                        resolve(true)
                                    }
                                });
                        });

                        Promise.all([promise_callStatus, promise_pauseStatus])
                            .then(response => {
                                res.send({
                                    status: 200,
                                    message: "succes"
                                })
                            })
                            .catch(err => {
                                res.status(500).json(err);
                            })
                    })
                    .catch((err) => {
                        res.status(500).json(err);
                    });
            })
            .catch((err) => {
                res.status(500).json(err);
            });
    }

    getLookupsByType(type) {
        let params = {};
        let _filter = [{
            operator: 'and',
            conditions: [
                {
                    field: 'type',
                    operator: 'eq',
                    value: type
                }
            ]
        }];
        params.filter = _filter;
        return new Promise((resolve, reject) => {
            this.db['lookups'].find(params)
                .then(response => {
                    resolve(response)
                })
                .catch(err => {
                    reject(err)
                })
        })

    }

    updateInbound(req, res, next) {
        let values = req.body;
        let uuid = values.params.queue.uuid;
        let {queue} = values.params;
        delete queue.uuid
        let {greetings, hold_music} = queue
        queue.greetings = ["http://myTestServer/IVRS/" + greetings];
        queue.hold_music = ["http://myTestServer/IVRS/" + hold_music];
        axios
            .put(`${base_url_cc_kam}api/v1/queues/${uuid}`, queue, call_center_authorization)
            .then(response => {
                this.db['campaigns'].update(values, {where: {campaign_id: values.campaign_id}})
                    .then(response => {
                        res.send({
                            status: 200,
                            message: "succes"
                        })
                    })
                    .catch(err => {
                        res.status(500).json(err);
                    })
            })
            .catch(err => {
                res.status(500).json(err);
            })
    }

    saveCallStatus(list_callstatus, cloned_campaign_id) {
        let index = 0;
        return new Promise((resolve, reject) => {
            if (list_callstatus && list_callstatus.length !== 0) {
                list_callstatus.forEach(callstatus_item => {
                    let {code, label, isDefault, active, isSystem} = callstatus_item;
                    let modalObj_cs = this.db['callstatuses'].build({
                        code,
                        label,
                        isDefault,
                        active,
                        isSystem,
                        campaign_id: cloned_campaign_id
                    });
                    modalObj_cs
                        .save()
                        .then(resp => {
                            if (index < list_callstatus.length - 1) {
                                index++;
                            } else {
                                resolve(true);
                            }
                        })
                        .catch((err) => {
                            reject(err);
                        });
                })
            } else {
                resolve(true)
            }
        })
    }

    savePauseStatus(list_pausestatus, cloned_campaign_id) {
        let index = 0;
        return new Promise((resolve, reject) => {
            if (list_pausestatus && list_pausestatus.length !== 0) {
                list_pausestatus.forEach(pausestatus_item => {
                    let {code, label, isDefault, active, duration} = pausestatus_item;
                    let modalObj_cs = this.db['pausestatuses'].build({
                        code,
                        label,
                        isDefault,
                        active,
                        duration,
                        campaign_id: cloned_campaign_id
                    });
                    modalObj_cs
                        .save()
                        .then(resp => {
                            if (index < list_pausestatus.length - 1) {
                                index++;
                            } else {
                                resolve(true);
                            }
                        })
                        .catch((err) => {
                            reject(err);
                        });
                })
            } else {
                resolve(true)
            }
        })
    }

    cloneCampaign(req, res, next) {
        let campaign = req.body;
        this.db['campaigns'].find({
            where: {campaign_id: campaign.campaign_id}
        })
            .then((campaign_to_clone) => {
                    let {
                        campaign_description,
                        campaign_type,
                        active,
                        status,
                        account_id,
                        params,
                        list_order,
                        list_mix,
                        hopper,
                        dial_level,
                        dialtimeout
                    } = campaign_to_clone
                    let cloned_campaign = {
                        campaign_description,
                        campaign_type,
                        active,
                        status,
                        account_id,
                        params,
                        list_order,
                        list_mix,
                        hopper,
                        dial_level,
                        dialtimeout
                    }
                    cloned_campaign.campaign_name = campaign.campaign_name;
                    cloned_campaign.agents = [];
                    let modalObj = this.db['campaigns'].build(cloned_campaign)
                    modalObj
                        .save()
                        .then((data) => {
                            let cloned_campaign_id = data.campaign_id
                            this.db['callstatuses'].findAll({
                                where: {campaign_id: campaign.campaign_id}
                            })
                                .then((list_callstatus) => {
                                    this.saveCallStatus(list_callstatus, cloned_campaign_id)
                                        .then(result => {
                                            this.db['pausestatuses'].findAll({
                                                where: {campaign_id: campaign.campaign_id}
                                            })
                                                .then((list_pausestatus) => {
                                                    // let list_pausestatus = res.data.data;
                                                    this.savePauseStatus(list_pausestatus, cloned_campaign_id)
                                                        .then(result => {
                                                            res.send({
                                                                status: 200,
                                                                message: "succes"
                                                            })
                                                        })
                                                        .catch((err) => {
                                                            res.status(500).json(err);
                                                        });
                                                })
                                                .catch((err) => {
                                                    res.status(500).json(err);
                                                });
                                        })
                                        .catch((err) => {
                                            res.status(500).json(err);
                                        });
                                })
                                .catch((err) => {
                                    res.status(500).json(err);
                                });
                        })
                        .catch((err) => {
                            res.status(500).json(err);
                        });
                }
            )
            .catch((err) => {
                res.status(500).json(err);
            });
    }

}

module.exports = campaigns;