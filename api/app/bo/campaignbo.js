const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
const Op = sequelize.Op;
let db = require('../models');
const {default: axios} = require("axios");
const {Sequelize} = require("sequelize");
const usersbo = require('./usersbo');
let _usersbo = new usersbo;
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

    saveCampaign(req, res, next) {
        let _this = this;
        let values = req.body;
        let {queue} = values.params;
        let params = values.params;
        let {greetings, hold_music} = queue.options;
        queue.greetings = ["http://myTestServer/IVRS/" + greetings];
        queue.hold_music = ["http://myTestServer/IVRS/" + hold_music];

        this.generateUniqueUsernameFunction()
            .then(queueName => {
                queue.name = queueName;
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
                            .then((campaign) => {
                                this.addDefaultStatus(campaign.campaign_id)
                                    .then(response => {
                                        res.send({
                                            status: 200,
                                            message: "succes"
                                        })
                                    })
                                    .catch(err => {
                                        return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                                    })
                            })
                            .catch((err) => {
                                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                            });
                    })
                    .catch((err) => {
                        return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                    });
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
            });
    }

    updateCampaignFunc(values, uuid) {
        return new Promise((resolve, reject) => {
            let {hold_music, greetings, accountcode, name, record, strategy, options, extension} = values.params.queue;
            let queue_ = {hold_music, greetings, accountcode, name, record, strategy, options, extension}
            queue_.greetings = ["http://myTestServer/IVRS/" + greetings];
            queue_.hold_music = ["http://myTestServer/IVRS/" + hold_music];
            axios
                .put(`${base_url_cc_kam}api/v1/queues/${uuid}`, queue_, call_center_authorization)
                .then(response => {
                    this.db['campaigns'].update(values, {where: {campaign_id: values.campaign_id}})
                        .then(response => {
                            resolve(true);
                        })
                        .catch((err) => {
                            reject(err);
                        });
                })
                .catch((err) => {
                    reject(err);
                });
        })
    }

    updateCampaign(req, res, next) {
        let _this = this;
        let values = req.body;
        let uuid = values.params.queue.uuid;
        this.updateCampaignFunc(values, uuid)
            .then(resp => {
                res.send({
                    status: 200,
                    message: "succes"
                })
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
            });
    }

    dissociateAgent(agents) {
        return new Promise((resolve, reject) => {
            if (agents && agents.length !== 0) {
                this.db['users'].update({campaign_id: 0}, {where: {user_id: agents}})
                    .then(() => {
                        resolve(true);
                    })
                    .catch(err => {
                        reject(err);
                    })
            } else {
                resolve(true)
            }
        })
    }

    deleteCampaignFunc(uuid, campaign_id) {
        return new Promise((resolve, reject) => {
            let agents_arr = ['*'];
            let agents = {agents: agents_arr};
            axios
                .post(`${base_url_cc_kam}api/v1/queues/${uuid}/tiers/delete`, agents, call_center_authorization)
                .then(resp => {
                    axios
                        .delete(`${base_url_cc_kam}api/v1/queues/${uuid}`, call_center_authorization)
                        .then(resp => {
                            this.db['campaigns'].findOne({where: {campaign_id: campaign_id}})
                                .then(campaign => {
                                    let agents = campaign.agents;
                                    this.dissociateAgent(agents)
                                        .then(resp => {
                                            this.db['campaigns'].update({active: 'N'}, {where: {campaign_id: campaign_id}})
                                                .then(result => {
                                                    resolve(true);
                                                })
                                                .catch((err) => {
                                                    reject(err);
                                                });
                                        })
                                        .catch(err => {
                                            reject(err);
                                        })
                                })
                                .catch(err => {
                                    reject(err);
                                })
                        })
                        .catch((err) => {
                            reject(err)
                        });
                })
                .catch(err => {
                    reject(err);
                })
        })
    }

    deleteCampaign(req, res, next) {
        let _this = this;
        let uuid = req.body.uuid;
        let campaign_id = req.body.campaign_id;
        this.deleteCampaignFunc(uuid, campaign_id)
            .then(result => {
                res.send({
                    succes: 200,
                    message: "Campaign has been deleted with success"
                })
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
            });
    }

    addDefaultPauseCallStatus(req, res, next) {
        let _this = this;
        let campaign_id = req.body.campaign_id;
        this.addDefaultStatus(campaign_id)
            .then(resp => {
                res.send({
                    status: 200,
                    message: "success"
                })
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
            });
    }

    addDefaultStatus(campaign_id) {
        return new Promise((resolve, reject) => {
            this.addDefaultCallStatus(campaign_id)
                .then(resp => {
                    this.addDefaultPauseStatus(campaign_id)
                        .then(result => {
                            resolve(result);
                        })
                        .catch(err => {
                            reject(err)
                        })
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    addDefaultCallStatus(campaign_id) {
        return new Promise((resolve, reject) => {
            let index_callstatus = 0;
            this.getLookupsByType("DEFAULTCALLSTATUS")
                .then((data) => {
                    if (data && data.length !== 0) {
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
                                    reject(err)
                                });
                        });
                    } else {
                        resolve(true)
                    }
                })
                .catch((err) => {
                    reject(err)
                });
        });
    }

    addDefaultPauseStatus(campaign_id) {
        return new Promise((resolve, reject) => {
            let index_pausestatus = 0;
            this.getLookupsByType("DEFAULTPAUSESTATUS")
                .then((data) => {
                    if (data && data.length !== 0) {
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
                                    reject(err);
                                });
                        });
                    } else {
                        resolve(true)
                    }
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    getLookupsByType(type) {
        return new Promise((resolve, reject) => {
            this.db['lookups'].findAll({where: {type: type}})
                .then(response => {
                    resolve(response)
                })
                .catch(err => {
                    reject(err)
                })
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
                                                    this.savePauseStatus(list_pausestatus, cloned_campaign_id)
                                                        .then(result => {
                                                            res.send({
                                                                status: 200,
                                                                message: "succes"
                                                            })
                                                        })
                                                        .catch((err) => {
                                                            return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                                                        });
                                                })
                                                .catch((err) => {
                                                    return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                                                });
                                        })
                                        .catch((err) => {
                                            return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                                        });
                                })
                                .catch((err) => {
                                    return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                                });
                        })
                        .catch((err) => {
                            return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                        });
                }
            )
            .catch((err) => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
            });
    }

    getAssignedAgents(req, res, next) {
        let _this = this;
        let {campaign_id, account_id} = req.body;
        this.db['campaigns'].findOne({where: {campaign_id: campaign_id}})
            .then(campaign => {
                this.db['users'].findAll({
                    where: {
                        role_crm_id: 3,
                        active: 'Y',
                        account_id: account_id,
                        $or: [{campaign_id: {$eq: campaign_id}}, {campaign_id: {$eq: 0}}],
                    }
                })
                    .then(agents => {
                        let campAgents = campaign.agents ? campaign.agents : [];
                        let assignedAgents = [];
                        let notAssignedAgents = [];
                        if (campAgents && campAgents.length !== 0) {
                            assignedAgents = agents.filter((agent) => campAgents.includes(agent.user_id));
                            notAssignedAgents = agents.filter((agent) => !campAgents.includes(agent.user_id));
                        } else {
                            assignedAgents = [];
                            notAssignedAgents = agents;
                        }
                        let data = {
                            assignedAgents,
                            notAssignedAgents,
                            campaign
                        }
                        res.send({
                            status: 200,
                            message: 'success',
                            data: data
                        })
                    })
                    .catch((err) => {
                        return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                    });
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
            });
    }

    updateIsAssignedStatus(agents, campaign_id, isAssigned, campaign_agents) {
        return new Promise((resolve, reject) => {
            if (agents && agents.length !== 0) {
                let agents_ids = agents.map(el => el.user_id);
                this.db['users'].update({
                    isAssigned: isAssigned,
                    campaign_id: campaign_id,
                }, {where: {user_id: agents_ids, active: 'Y'}})
                    .then(() => {
                        resolve(true);
                    })
                    .catch(err => {
                        reject(err);
                    })
            } else {
                resolve(true);
            }
        })
    }

    addToQueue(tiers, queue_uuid) {
        return new Promise((resolve, reject) => {
            if (tiers.tiers && tiers.tiers.length !== 0) {
                axios
                    .post(`${base_url_cc_kam}api/v1/queues/${queue_uuid}/tiers`, tiers, call_center_authorization)
                    .then(resp => {
                        resolve(true)
                    })
                    .catch(err => {
                        reject(err);
                    })
            } else {
                resolve(true)
            }
        })
    }

    deleteAgentsMeetings(agents) {
        let agents_ids = agents.map(el => el.user_id)
        return new Promise((resolve, reject) => {
            if (agents && agents.length !== 0) {
                this.db['meetings'].update({active: 'N'}, {where: {agent_id: agents_ids}})
                    .then(() => {
                        resolve(true);
                    })
                    .catch(err => {
                        reject(err);
                    })
            } else {
                resolve(true)
            }
        })
    }

    deleteAgentsFromQueue(campaign_agents, queue_uuid, agents) {
        return new Promise((resolve, reject) => {
            if (campaign_agents && campaign_agents.length !== 0) {
                axios
                    .post(`${base_url_cc_kam}api/v1/queues/${queue_uuid}/tiers/delete`, agents, call_center_authorization)
                    .then(resp => {
                        resolve(true);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            } else {
                resolve(true);
            }
        })
    }

    assignAgents(req, res, next) {
        let _this = this;
        let {campaign_id, agents, queue_uuid, assignedAgents, notAssignedAgents, campaign_agents} = req.body;
        let updates = {campaign_id, agents};
        this.updateIsAssignedStatus(assignedAgents, campaign_id, true, campaign_agents)
            .then(resp => {
                this.updateIsAssignedStatus(notAssignedAgents, 0, false, campaign_agents)
                    .then(resp => {
                        this.deleteAgentsMeetings(notAssignedAgents)
                            .then(result => {
                                let _agents = (assignedAgents && assignedAgents.length !== 0) ? assignedAgents.map(el => el.user_id) : [];
                                this.db['campaigns'].update({agents: _agents}, {
                                    where: {
                                        campaign_id: campaign_id,
                                        active: 'Y'
                                    }
                                })
                                    .then(() => {
                                        let agents_arr = ['*'];
                                        let agents = {agents: agents_arr};
                                        this.deleteAgentsFromQueue(campaign_agents, queue_uuid, agents)
                                            .then(resp => {
                                                let tiers_array = (assignedAgents && assignedAgents.length !== 0) ?
                                                    assignedAgents.map(el => ({
                                                        agent_uuid: el.sip_device.uuid,
                                                        tier_level: 1,
                                                        tier_position: 1
                                                    })) : [];
                                                let tiers = {tiers: tiers_array};
                                                this.addToQueue(tiers, queue_uuid)
                                                    .then(resp => {
                                                        this.db['campaigns'].update(updates, {
                                                            where: {
                                                                active: 'Y',
                                                                campaign_id: campaign_id
                                                            }
                                                        })
                                                            .then(resp => {
                                                                res.send({
                                                                    status: 200,
                                                                    message: 'success'
                                                                })
                                                            })
                                                            .catch((err) => {
                                                                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                                                            });
                                                    })
                                                    .catch((err) => {
                                                        return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                                                    });
                                            })
                                            .catch((err) => {
                                                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                                            });
                                    })
                                    .catch((err) => {
                                        return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                                    });
                            })
                            .catch((err) => {
                                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                            });
                    })
                    .catch((err) => {
                        return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                    });
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
            });
    }

    isUniqueQueueName(queue_name) {
        let _this = this;
        return new Promise((resolve, reject) => {
            this.db['campaigns'].findAll({where: {active: 'Y'}})
                .then(campaigns => {
                    if (campaigns && campaigns.length !== 0) {
                        let result = campaigns.filter(campaign => campaign.params.queue === queue_name);
                        if (result && result.length !== 0) {
                            resolve(false)
                        } else {
                            resolve(true);
                        }
                    } else {
                        resolve(true);
                    }
                })
                .catch(err => {
                    reject(err);
                })
        })
    }

    generateUniqueUsernameFunction() {
        let condition = false;
        return new Promise((resolve, reject) => {
            do {
                _usersbo.generateUsername()
                    .then(generatedQueueName => {
                        this.isUniqueQueueName(generatedQueueName)
                            .then(isUnique => {
                                condition = isUnique;
                                if (condition) {
                                    resolve(generatedQueueName)
                                }
                            })
                            .catch(err => {
                                reject(err)
                            })
                    })
                    .catch(err => {
                        reject(err)
                    })
            } while (condition)
        })
    }
}

module.exports = campaigns;