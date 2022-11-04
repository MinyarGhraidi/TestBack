const {baseModelbo} = require('./basebo');
const {default: axios} = require("axios");
const usersbo = require('./usersbo');
const agentbo = require('./agentsbo')
const {add} = require("nodemon/lib/rules");
const call_center_token = require(__dirname + '/../config/config.json')["call_center_token"];
const base_url_cc_kam = require(__dirname + '/../config/config.json')["base_url_cc_kam"];
const call_center_authorization = {
    headers: {Authorization: call_center_token}
};

let _usersbo = new usersbo;
let _agentsbo = new agentbo;

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
                                            message: "success",
                                            data: campaign
                                        })
                                    })
                                    .catch(err => {
                                        return _this.sendResponseError(res, ['cannot save default status', err], 1, 403);
                                    })
                            })
                            .catch((err) => {
                                return _this.sendResponseError(res, ['Cannot save campaigns in DB', err], 1, 403);
                            });
                    })
                    .catch((err) => {
                        return _this.sendResponseError(res, ['Cannot save campaign in Kamailio', err], 1, 403);
                    });
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
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
                return _this.sendResponseError(res, ['Cannot update Campaign', err], 1, 403);
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
        let _this = this;
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
                                                .then(() => {
                                                    this.db['meetings'].update({status: 0}, {where: {campaign_id: campaign_id}})
                                                        .then(() => {
                                                            _this.deleteCampaignFiles(campaign_id)
                                                                .then(() => {
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
                            reject(err);
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
                return _this.sendResponseError(res, ['Cannot delete Campaign', err], 1, 403);
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
                return _this.sendResponseError(res, ['Cannot save default call/pause status', err], 1, 403);
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
        let _this = this;
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
                let {queue} = params;
                let {greetings, hold_music} = queue.options;
                queue.greetings = ["http://myTestServer/IVRS/" + greetings];
                queue.hold_music = ["http://myTestServer/IVRS/" + hold_music];
                cloned_campaign.campaign_name = campaign.campaign_name;
                cloned_campaign.agents = [];
                this.generateUniqueUsernameFunction()
                    .then(queueName => {
                        queue.name = queueName;
                        queue.extension = queueName;
                        axios
                            .post(`${base_url_cc_kam}api/v1/queues`, queue, call_center_authorization)
                            .then((result) => {
                                let {uuid} = result.data.queue;
                                queue.uuid = uuid;
                                queue.greetings = greetings;
                                queue.hold_music = hold_music;
                                params.queue = queue;
                                delete cloned_campaign.params;
                                cloned_campaign.params = params;
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
                                                                        if (campaign && campaign.didsGp_ids.length !== 0) {
                                                                            this.db['didsgroups'].update({campaign_id: data.campaign_id}, {where: {did_id: {in: campaign.didsGp_ids}}}).then(data => {
                                                                                res.send({
                                                                                    status: 200,
                                                                                    data: data,
                                                                                    message: "success clone campaign"
                                                                                })
                                                                            }).catch((err) => {
                                                                                return _this.sendResponseError(res, ['Error.AffectDidGroupsCampaign', err], 1, 403);
                                                                            });
                                                                        } else {
                                                                            res.send({
                                                                                status: 200,
                                                                                data: data,
                                                                                message: "success clone campaign"
                                                                            })
                                                                        }
                                                                    })
                                                                    .catch((err) => {
                                                                        return _this.sendResponseError(res, ['cannot save pause status', err], 1, 403);
                                                                    });
                                                            })
                                                            .catch((err) => {
                                                                return _this.sendResponseError(res, ['cannot fetch list call status', err], 1, 403);
                                                            });
                                                    })
                                                    .catch((err) => {
                                                        return _this.sendResponseError(res, ['cannot save campaign', err], 1, 403);
                                                    });
                                            })
                                            .catch((err) => {
                                                return _this.sendResponseError(res, ['cannot save campaign', err], 1, 403);
                                            });
                                    })
                                    .catch((err) => {
                                        return _this.sendResponseError(res, ['cannot save campaign in kamailio', err], 1, 403);
                                    });
                            })
                            .catch((err) => {
                                return _this.sendResponseError(res, ['error in generate unique name', err], 1, 403);
                            });
                    }).catch(err => {
                    _this.sendResponseError(res, ['cannot save pause status', err, 403]);
                })
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['cannot fetch campaign', err], 1, 403);
            });
    }

    areEqualArrays(first, second) {
        if (first.length !== second.length) {
            return false;
        }
        ;
        for (let i = 0; i < first.length; i++) {
            if (!second.includes(first[i])) {
                return false;
            }
            ;
        }
        ;
        return true;
    }

    fixConsistency(queue_uuid, allAgents, queue_agents, db_agents, campaign_id, campaign) {
        return new Promise((resolve, reject) => {
            let areEqual = this.areEqualArrays(queue_agents, db_agents);
            if (areEqual) {
                resolve(campaign);
            } else {
                if (queue_agents.length > db_agents.length) {
                    let agents_not_assigned = queue_agents.filter(el => !db_agents.includes(el));
                    axios
                        .post(`${base_url_cc_kam}api/v1/queues/${queue_uuid}/tiers/delete`, {agents: agents_not_assigned}, call_center_authorization)
                        .then(resp => {
                            resolve(campaign);
                        })
                        .catch(err => {
                            reject(err)
                        })

                } else {
                    let not_assigned = allAgents.filter(el => !queue_agents.includes(el.sip_device.uuid));
                    let agents_list = not_assigned.map(el => el.user_id);
                    this.db['users'].update({campaign_id: 0}, {where: {user_id: agents_list}})
                        .then(resp => {
                            this.db['campaigns'].update({agents: allAgents.filter(el => queue_agents.includes(el.sip_device.uuid))}, {where: {campaign_id: campaign_id}})
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
                }
            }
        })
    }

    getAssignedAgents(req, res, next) {
        let _this = this;
        let {campaign_id, account_id, queue_uuid, camp_agents} = req.body;
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
                        axios
                            .get(`${base_url_cc_kam}api/v1/queues/${queue_uuid}/tiers`, call_center_authorization)
                            .then(data => {
                                this.db['users'].findAll({where: {user_id: camp_agents, active: 'Y'}})
                                    .then(allAgents => {
                                        let queue_agents = data.data.result.map(el => el.agent_uuid);
                                        let db_agents = (allAgents && allAgents.length !== 0) ? allAgents.map(el => el.sip_device.uuid) : [];
                                        this.fixConsistency(queue_uuid, allAgents, queue_agents, db_agents, campaign_id, campaign)
                                            .then(camp => {
                                                let campAgents = camp.agents ? camp.agents : [];
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
                                                    campaign: camp
                                                }
                                                res.send({
                                                    status: 200,
                                                    message: 'success',
                                                    data: data
                                                })
                                            })
                                            .catch(err => {
                                                return _this.sendResponseError(res, ['Error fix consistency', err], 1, 403);
                                            })
                                    })
                                    .catch(err => {
                                        return _this.sendResponseError(res, ['cannot get list of users', err], 1, 403);
                                    })
                            })
                            .catch(err => {
                                return _this.sendResponseError(res, ['Kamailio error', err], 1, 403);
                            })
                    })
                    .catch((err) => {
                        return _this.sendResponseError(res, ['cannot get list agents', err], 1, 403);
                    });
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['cannot fetch campaign', err], 1, 403);
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
        console.log(queue_uuid)
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
        let {campaign_id, queue_uuid, assignedAgents, notAssignedAgents, campaign_agents} = req.body;
        console.log(req.body)
        if (!!!campaign_id || !!!queue_uuid || !!!assignedAgents || !!!notAssignedAgents || !!!campaign_agents) {
            return _this.sendResponseError(res, ['cannot update status of assigned agents'], 1, 403);
        }
        let _agents = (assignedAgents && assignedAgents.length !== 0) ? assignedAgents.map(el => el.user_id) : [];
        let agents_arr = ['*'];
        let agents_kam = {agents: agents_arr};
        this.deleteAgentsFromQueue(campaign_agents, queue_uuid, agents_kam)
            .then(() => {
                let tiers_array = (assignedAgents && assignedAgents.length !== 0) ?
                    assignedAgents.map(el => ({
                        agent_uuid: el.sip_device.uuid,
                        tier_level: 1,
                        tier_position: 1
                    })) : [];
                let tiers = {tiers: tiers_array};
                this.addToQueue(tiers, queue_uuid)
                    .then(() => {
                        this.db['campaigns'].update({agents: _agents}, {where: {active: 'Y', campaign_id: campaign_id}})
                            .then(() => {
                                this.updateIsAssignedStatus(assignedAgents, campaign_id, true, campaign_agents)
                                    .then(() => {
                                        this.updateIsAssignedStatus(notAssignedAgents, 0, false, campaign_agents)
                                            .then(() => {
                                                this.deleteAgentsMeetings(notAssignedAgents)
                                                    .then(() => {
                                                        res.send({
                                                            status: 200,
                                                            message: 'success'
                                                        })
                                                    })
                                                    .catch((err) => {
                                                        return _this.sendResponseError(res, ['cannot delete agent meetings', err], 1, 403);
                                                    });
                                            })
                                            .catch((err) => {
                                                return _this.sendResponseError(res, ['cannot update status of unassigned agents', err], 1, 403);
                                            });
                                    })
                                    .catch((err) => {
                                        return _this.sendResponseError(res, ['cannot update status of assigned agents', err], 1, 403);
                                    });
                            })
                            .catch((err) => {
                                return _this.sendResponseError(res, ['cannot update campaign', err], 1, 403);
                            });
                    })
                    .catch((err) => {
                        return _this.sendResponseError(res, ['cannot add to queue in kamailio', err], 1, 403);
                    });
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['cannot delete from queue in kamailio', err], 1, 403);
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

    changeAGentsStatus(agents) {
        let _this = this;
        let index = 0;
        return new Promise((resolve, reject) => {
            if (agents && agents.length !== 0) {
                agents.forEach(user_id => {
                    this.db['users'].findOne({where: {user_id: user_id, active: 'Y'}})
                        .then(agent => {
                            if (Object.keys(agents) && Object.keys(agents).length !== 0) {
                                let uuid = agent.sip_device.uuid;
                                _agentsbo.onConnectFunc(user_id, uuid, "logged-out", "logged-out")
                                    .then(() => {
                                        if (index < agents.length - 1) {
                                            index++;
                                        } else {
                                            resolve(true);
                                        }
                                    })
                                    .catch(err => {
                                        reject(err);
                                    })
                            } else {
                                resolve(true)
                            }
                        })
                        .catch(err => {
                            reject(err);
                        })
                })
            } else {
                resolve(true)
            }
        })
    }

    deleteCallFiles(listcallfiles_id) {
        return new Promise((resolve, reject) => {
            if (listcallfiles_id && listcallfiles_id.length - 1) {
                this.db['callfiles']
                    .update({active: 'N'}, {where: {listcallfile_id: listcallfiles_id, active: 'Y'}})
                    .then(() => {
                        resolve(true);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            } else {
                reject(true);
            }
        })
    }

    changeStatusCallFiles(listcallfiles_id, status) {
        return new Promise((resolve, reject) => {
            if (listcallfiles_id && listcallfiles_id.length - 1) {
                this.db['callfiles']
                    .update({status: status}, {where: {listcallfile_id: listcallfiles_id, active: 'Y'}})
                    .then(() => {
                        resolve(true);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            } else {
                reject(true);
            }
        })
    }

    deleteCampaignFiles(campaign_id) {
        return new Promise((resolve, reject) => {
            this.db['listcallfiles']
                .findAll({where: {campaign_id: campaign_id, active: 'Y'}})
                .then(listcallfiles => {
                    let listcallfiles_id = listcallfiles.map(el => el.listcallfile_id);
                    this.db['listcallfiles']
                        .update({active: 'N'}, {where: {campaign_id: campaign_id, active: 'Y'}})
                        .then(() => {
                            this.deleteCallFiles(listcallfiles_id)
                                .then(() => {
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
                .catch((err) => {
                    reject(err);
                });
        })
    }

    changeStatusCampaignFiles(campaign_id, status) {
        return new Promise((resolve, reject) => {
            this.db['listcallfiles']
                .findAll({where: {campaign_id: campaign_id, active: 'Y'}})
                .then(listcallfiles => {
                    let listcallfiles_id = listcallfiles.map(el => el.listcallfile_id);
                    this.db['listcallfiles']
                        .update({status: status}, {where: {campaign_id: campaign_id, active: 'Y'}})
                        .then(() => {
                            this.changeStatusCallFiles(listcallfiles_id, status)
                                .then(() => {
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
                .catch((err) => {
                    reject(err);
                });
        })
    }

    changeStatus(req, res, next) {
        let _this = this;
        let {campaign_id} = req.body;
        this.db['campaigns'].findOne({where: {campaign_id: campaign_id, active: 'Y'}})
            .then(campaign => {
                if (Object.keys(campaign) && Object.keys(campaign).length !== 0) {
                    let agents = campaign.agents;
                    let isActivate = campaign.status === 'N';
                    if (isActivate) {
                        this.db['campaigns'].update({status: 'Y'}, {where: {campaign_id: campaign_id}})
                            .then(() => {
                                this.changeStatusCampaignFiles(campaign_id, 'Y')
                                    .then(() => {
                                        res.send({
                                            status: 200,
                                            message: "success"
                                        })
                                    })
                                    .catch((err) => {
                                        return _this.sendResponseError(res, ['cannot change the campaign status', err], 1, 403);
                                    });
                            })
                            .catch((err) => {
                                return _this.sendResponseError(res, ['cannot change the campaign status', err], 1, 403);
                            });
                    } else {
                        _this.changeAGentsStatus(agents)
                            .then(() => {
                                this.db['campaigns'].update({status: 'N'}, {where: {campaign_id: campaign_id}})
                                    .then(() => {
                                        this.changeStatusCampaignFiles(campaign_id, 'N')
                                            .then(() => {
                                                res.send({
                                                    status: 200,
                                                    message: "success"
                                                })
                                            })
                                            .catch((err) => {
                                                return _this.sendResponseError(res, ['cannot change the campaign status', err], 1, 403);
                                            });
                                    })
                                    .catch((err) => {
                                        return _this.sendResponseError(res, ['cannot change the campaign status', err], 1, 403);
                                    });
                            })
                            .catch((err) => {
                                return _this.sendResponseError(res, ['cannot change agent status', err], 1, 403);
                            });
                    }
                } else {
                    return _this.sendResponseError(res, ['Campaign not found'], 1, 403);
                }
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['cannot fetch campaign', err], 1, 403);
            });
    }

    authorize(req, res, next) {
        let _this = this;
        let to_number = req.body.to_number;
        let data_resp = {
            "action": "allow",
            "deny_code": "",
            "deny_reason": "",
            "type": "queue",
            "destination": "",
            "caller_id_number": "",
            "pai": "",
            "privacy": 0,
            "max_duration": 0,
            "gateways": []
        }
        this.db["campaigns"]
            .findAll({
                where: {
                    active: "Y",
                },
            })
            .then(campaigns => {
                if (campaigns && campaigns.length !== 0) {
                    let current_camp = campaigns.filter(item => item.params.queue.extension === to_number);
                    if (current_camp && current_camp.length !== 0) {
                        data_resp.destination = current_camp[0].params.queue.extension;
                        res.send(data_resp);
                    } else {
                        data_resp.destination = to_number
                        data_resp.action = "allow";
                        res.send(data_resp);
                    }
                } else {
                    data_resp.destination = to_number
                    data_resp.action = "allow";
                    res.send(data_resp);
                }
            })
            .catch((err) => {
                data_resp.destination = to_number
                data_resp.action = "allow";
                res.send(data_resp);
            });
    }

    changeStatus_callfilesByIdListCallFiles(listCallFiles_id, status) {
        return new Promise((resolve, reject) => {
            this.db["callfiles"].update({
                status: status,
                updated_at: new Date()
            }, {where: {listcallfile_id: listCallFiles_id, active: 'Y'}})
                .then(
                    () => {
                        resolve(true);
                    }
                ).catch(err => {
                return reject(err);
            });
        })
    }

    changeStatus_callfiles(campaign_id, status) {
        let indexCallFiles = 0;

        return new Promise((resolve, reject) => {
            this.db['listcallfiles'].findAll({
                where: {
                    campaign_id: campaign_id,
                }
            }).then((callFilesList) => {
                if (!!!callFilesList.length !== 0) {
                    return resolve(true);
                }
                callFilesList.forEach(data => {
                    this.changeStatus_callfilesByIdListCallFiles(data.listcallfile_id, status).then(() => {
                        if (indexCallFiles < callFilesList.length - 1) {
                            indexCallFiles++;
                        }else{
                            resolve(true);
                        }

                    }).catch(err => {
                        reject(err);
                    })


                });
            }).catch(err => {
                reject(err);
            });

        })
    }

    changeStatusForEntities(entities, campaign_id, status) {
        let indexEntities = 0;
        return new Promise((resolve, reject) => {
            entities.map(dbs => {
                this.db[dbs].update({status: status, updated_at: new Date()}, {
                    where: {
                        campaign_id: campaign_id,
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

    changeStatusComp(compaign_id, status) {
        return new Promise((resolve, reject) => {
            const UpdateEntities = ['pausestatuses', 'listcallfiles', 'callstatuses'];
            this.changeStatusForEntities(UpdateEntities, compaign_id, status).then(() => {
                this.changeStatus_callfiles(compaign_id, status).then(() => {
                    resolve(true);
                }).catch(err => {
                    return reject(err);
                });
            }).catch(err => {
                return reject(err);
            });

        })
    }

    changeStatusByIdCompaign(req, res, next) {
        let {compaign_id, status} = req.body;
        if ((!!!compaign_id || !!!status)) {
            return this.sendResponseError(res, ['Error.RequestDataInvalid'], 0, 403);
        }
        if (status !== 'N' && status !== 'Y') {
            return this.sendResponseError(res, ['Error.StatusMustBe_Y_Or_N'], 0, 403);
        }
        this.changeStatusComp(compaign_id, status).then(data => {
            res.send({
                status: 200,
                message: "success",
                success: true
            })
        }).catch((error) => {
            return this.sendResponseError(res, ['Error.AnErrorHasOccurredChangeStatusCompaign', error], 1, 403);
        });
    }
}

module.exports = campaigns;
