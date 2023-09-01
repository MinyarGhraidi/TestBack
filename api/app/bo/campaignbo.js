const {baseModelbo} = require('./basebo');
const {default: axios} = require("axios");
const efilebo = require('./efilesbo')
const listcallfilesbo = require('./listcallfilesbo')
const agent_log_eventsbo = require('./agent_log_eventsbo')
const env = process.env.NODE_ENV || 'development';
const call_center_token = require(__dirname + '/../config/config.json')[env]["call_center_token"];
const base_url_cc_kam = require(__dirname + '/../config/config.json')[env]["base_url_cc_kam"];
const appSocket = new (require("../providers/AppSocket"))();
const helpers = require('../helpers/helpers')
const moment = require("moment");
const db = require("../models");
const call_center_authorization = {
    headers: {Authorization: call_center_token}
};
const Op = require("sequelize/lib/operators");

let _efilebo = new efilebo;
let _listcallfilesbo = new listcallfilesbo;
let _agent_log_eventsbo = new agent_log_eventsbo;

class campaigns extends baseModelbo {
    constructor() {
        super('campaigns', 'campaign_id');
        this.baseModal = "campaigns";
        this.primaryKey = 'campaign_id';
    }

    //---------------> Add Campaign <------------------------
    saveCampaign(req, res, next) {
        let _this = this;
        let values = req.body;
        let {queue} = values.params;
        let params = values.params;
        let {greetings, hold_music} = queue.options;
        _efilebo.checkFile([greetings, hold_music], "SaveUpdate", values.account_id).then((result) => {
            if (result.success) {
                queue.greetings = result.data.greetings === null ? [] : [result.data.greetings];
                queue.hold_music = result.data.hold_music === null ? [] : [result.data.hold_music];
                this.generateUniqueUsernameFunction()
                    .then(queueName => {
                        queue.name = queueName;
                        queue.domain_uuid = values.domain.params.uuid;
                        axios
                            .post(`${base_url_cc_kam}api/v1/queues`, queue, call_center_authorization)
                            .then((result) => {
                                let {uuid} = result.data.result;
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
                                                    data: campaign,
                                                    success: true
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
            } else {
                res.send({
                    status: 403,
                    success: false,
                    message: 'audios not found'
                })
            }
        }).catch((err) => {
            res.send({
                status: 403,
                success: false,
                message: 'audios not found'
            })
        });

    }

    //----------------> Update Campaign <--------------------------
    updateCampaign(req, res, next) {
        let _this = this;
        let values = req.body;
        let uuid = values.params.queue.uuid;
        this.updateCampaignFunc(values, uuid)
            .then(resp => {
                res.send({
                    status: resp.status,
                    message: resp.message,
                    success: resp.success
                })
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['Cannot update Campaign', err], 1, 403);
            });
    }

    updateCampaignFunc(values, uuid) {
        return new Promise((resolve, reject) => {
            let {accountcode, record, strategy, options} = values.params.queue;
            let {hold_music, greetings} = values.params.queue.options;
            _efilebo.checkFile([greetings, hold_music], "SaveUpdate", values.account_id).then((result) => {
                if (result.success) {
                    axios
                        .get(`${base_url_cc_kam}api/v1/queues/${uuid}`, call_center_authorization)
                        .then(resp => {
                            let {name, extension, domain_uuid} = resp.data.result;
                            let queue_ = {
                                hold_music,
                                greetings,
                                accountcode,
                                name,
                                record,
                                strategy,
                                options,
                                extension,
                                domain_uuid
                            }
                            queue_.greetings = result.data.greetings === null ? [] : [result.data.greetings];
                            queue_.hold_music = result.data.hold_music === null ? [] : [result.data.hold_music];

                            axios
                                .put(`${base_url_cc_kam}api/v1/queues/${uuid}`, queue_, call_center_authorization)
                                .then(response => {
                                    let campaign_Updated = {
                                        params: {
                                            queue: {
                                                name, uuid, record, strategy, extension, accountcode, domain_uuid,
                                                options: queue_.options
                                            }
                                        },
                                        updated_at: moment(new Date())
                                    }
                                    this.db['campaigns'].update(campaign_Updated, {where: {campaign_id: values.campaign_id}})
                                        .then(response => {
                                            resolve({
                                                success: true,
                                                status: 200,
                                                message: 'Success'
                                            });
                                        })
                                        .catch((err) => {
                                            reject(err);
                                        });
                                })
                                .catch((err) => {
                                    reject(err);
                                });
                        }).catch((err) => {

                        reject(err);
                    })
                } else {
                    resolve({
                        success: false,
                        status: 403,
                        message: 'audio-not-found'
                    });
                }
            }).catch(err => {
                reject(err)
            })
        })
    }

    //----------------> Delete Campaign <---------------------------
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
                                        .then(() => {
                                            this.db['campaigns'].update({active: 'N'}, {where: {campaign_id: campaign_id}})
                                                .then(() => {
                                                    this.db['meetings'].update({
                                                        status: 0,
                                                        updated_at: moment(new Date())
                                                    }, {where: {campaign_id: campaign_id}})
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

    dissociateAgent(agents) {
        return new Promise((resolve, reject) => {
            if (agents && agents.length !== 0) {
                this.db['users'].update({campaign_id: null, isAssigned: false}, {where: {user_id: agents}})
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

    deleteCampaignFiles(campaign_id) {
        return new Promise((resolve, reject) => {
            this.db['listcallfiles']
                .findAll({where: {campaign_id: campaign_id, active: 'Y'}})
                .then(listcallfiles => {
                    if (listcallfiles && listcallfiles.length !== 0) {
                        let listcallfiles_ids = listcallfiles.map(el => el.listcallfile_id);
                        let idx = 0;
                        listcallfiles_ids.forEach(listcallfile_id => {
                            _listcallfilesbo._deleteFromHooperByCallfileID(listcallfile_id).then(() => {
                                this.deleteWithChild('listcallfiles', 'callfiles', 'listcallfile_id', 'listcallfile_id', listcallfile_id).then(() => {
                                    if (idx < listcallfiles_ids.length - 1) {
                                        idx++
                                    } else {
                                        resolve(true)
                                    }
                                }).catch((err) => reject(err))
                            }).catch(err => reject(err))
                        })
                    } else {
                        resolve(true)
                    }
                })
                .catch((err) => {
                    reject(err);
                });
        })
    }

    //-----------------> Change Status Campaign <---------------------
    changeStatus(req, res, next) {
        let _this = this;
        let {campaign_id, status} = req.body;
        if ((!!!campaign_id || !!!status)) {
            return this.sendResponseError(res, ['Error.RequestDataInvalid'], 0, 403);
        }
        if (status !== 'N' && status !== 'Y') {
            return this.sendResponseError(res, ['Error.StatusMustBe_Y_Or_N'], 0, 403);
        }
        this.db['campaigns'].findOne({where: {campaign_id: campaign_id, active: 'Y'}})
            .then(campaign => {
                if (campaign) {
                    this.db['campaigns'].update({
                        status: status,
                        updated_at: moment(new Date())
                    }, {where: {campaign_id: campaign_id}})
                        .then(() => {
                            if (status === 'N') {
                                this.changeStatusComp(campaign_id, status).then(() => {
                                    return res.send({
                                        status: 200,
                                        message: "success"
                                    })

                                }).catch((err) => {
                                    return _this.sendResponseError(res, ['cannot change the campaign status1', err], 1, 403);
                                })
                            } else {
                                return res.send({
                                    status: 200,
                                    message: "success"
                                })
                            }
                        }).catch((err) => {
                        return _this.sendResponseError(res, ['cannot change the campaign status2', err], 1, 403);
                    });
                } else {
                    return _this.sendResponseError(res, ['Campaign not found'], 1, 403);
                }
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['cannot fetch campaign', err], 1, 403);
            });
    }

    changeStatusComp(compaign_id, status) {
        return new Promise((resolve, reject) => {
            let indexCallFiles = 0;
            const UpdateEntities = ['pausestatuses', 'callstatuses', 'call_blundings'];
            this.changeStatusForEntities(UpdateEntities, compaign_id, status).then(() => {
                this.db['listcallfiles'].findAll({where : {campaign_id : compaign_id , active : 'Y', status : 'Y'}}).then(lcfs => {
                    if(lcfs && lcfs.length !== 0){
                        let lcfs_ids = lcfs.map(l => l.listcallfile_id);
                        lcfs_ids.forEach(lcf_id => {
                            _listcallfilesbo._changeStatusLCF(lcf_id, status).then(() => {
                                if (indexCallFiles < lcfs_ids.length - 1) {
                                    indexCallFiles++;
                                } else {
                                    return resolve(true);
                                }
                            }).catch(err => {
                                return reject(err)
                            })
                        });
                    }else{
                        return resolve(true);
                    }
                })
            }).catch(err => {
                return reject(err);
            });

        })
    }

    changeStatusForEntities(entities, campaign_id, status) {
        let indexEntities = 0;
        return new Promise((resolve, reject) => {
            entities.map(dbs => {
                this.db[dbs].update({status: status, updated_at: moment(new Date())}, {
                    where: {
                        campaign_id: campaign_id,
                        active: 'Y',
                        status : 'Y'
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
    //-------------> Default Pause Call Status Camapign <----------------------
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

    //----------------> Clone Campaign <----------------------
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
                    dialtimeout,
                    config,
                    script,
                    trunck_id,
                    call_status_ids
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
                    dialtimeout,
                    script,
                    trunck_id,
                    call_status_ids,
                    config: campaign.config ? campaign.config : config
                }
                let {queue} = params;
                let {greetings, hold_music} = queue.options;
                queue.greetings = [];
                queue.hold_music = [];
                cloned_campaign.campaign_name = campaign.campaign_name;
                cloned_campaign.agents = [];
                this.generateUniqueUsernameFunction()
                    .then(queueName => {
                        queue.name = queueName;
                        queue.extension = queueName;
                        queue.domain_uuid = params.queue.domain_uuid;
                        axios
                            .post(`${base_url_cc_kam}api/v1/queues`, queue, call_center_authorization)
                            .then((result) => {
                                let {uuid} = result.data.result;
                                queue.uuid = uuid;
                                queue.greetings = greetings;
                                queue.hold_music = hold_music;
                                params.queue = queue;
                                delete cloned_campaign.params;
                                cloned_campaign.params = params;
                                cloned_campaign.updated_at = moment(new Date());
                                cloned_campaign.created_at = moment(new Date());
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
                                                                            data: data,
                                                                            message: "success clone campaign"
                                                                        })

                                                                    }).catch(err => {
                                                                    _this.sendResponseError(res, ['cannot save pause status', err, 403]);
                                                                });
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
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['cannot fetch campaign', err], 1, 403);
            });
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


    //-----------------> Assign / Unassign Agents to Campaign <--------------
    _getAssigned_UnasignedAgentsByQueueUUIDS(campaign_id, roleCrmAgent, account_id, queue_uuids, campaign_agents, queue_uuid) {
        return new Promise((resolve, reject) => {
            this.db['users'].findAll({
                where: {
                    role_crm_id: roleCrmAgent,
                    active: 'Y',
                    account_id: account_id,
                    $or: [{campaign_id: {$eq: campaign_id}}, {campaign_id: {$eq: null}}]
                }
            }).then(data => {
                if (data && data.length !== 0) {
                    let assignedToCampaign = data.filter(agent => agent.isAssigned === true) || []
                    let assignedUUIDs = assignedToCampaign.map(agent => agent.sip_device.uuid)
                    let notAssignedToCampaign = data.filter(agent => agent.isAssigned === false) || []
                    if (this.areEqualArrays(queue_uuids, assignedUUIDs)) {
                        resolve({
                            assigned: assignedToCampaign,
                            unassigned: notAssignedToCampaign,
                            campaign_user_ids: campaign_agents
                        })
                    } else {
                        this.fixConsistency(queue_uuids, assignedToCampaign, notAssignedToCampaign, queue_uuid, campaign_agents, campaign_id).then((res_users) => {
                            if (res_users.data && res_users.length !== 0) {
                                const areUnasigned = assignedToCampaign.filter(obj => res_users.data.includes(obj.user_id));
                                const newAssigned = assignedToCampaign.filter(obj => !res_users.data.includes(obj.user_id));
                                let newUnassigned = notAssignedToCampaign.concat(areUnasigned);
                                resolve({
                                    assigned: newAssigned,
                                    unassigned: newUnassigned,
                                    campaign_user_ids: res_users.campaign_agents
                                })
                            } else {
                                resolve({
                                    assigned: assignedToCampaign,
                                    unassigned: notAssignedToCampaign,
                                    campaign_user_ids: campaign_agents
                                })
                            }
                        }).catch(err => reject(err))
                    }
                } else {
                    resolve({
                        assigned: [],
                        unassigned: [],
                        campaign_user_ids: campaign_agents
                    })
                }
            }).catch(err => reject(err))
        })
    }

    getAssignedAgents(req, res, next) {
        let _this = this;
        let {campaign_id, account_id, queue_uuid, roleCrmAgent} = req.body;
        this.db['campaigns'].findOne({where: {campaign_id: campaign_id}})
            .then(campaign => {
                if (campaign && Object.keys(campaign).length !== 0) {
                    axios
                        .get(`${base_url_cc_kam}api/v1/queues/${queue_uuid}/tiers`, call_center_authorization)
                        .then(data => {
                            let queue_agents_uuids = data.data.result.map(el => el.agent_uuid);
                            this._getAssigned_UnasignedAgentsByQueueUUIDS(campaign_id, roleCrmAgent, account_id, queue_agents_uuids, campaign.agents || [], queue_uuid).then(data_agents => {
                                let newCamp = campaign
                                newCamp.agents = data_agents.campaign_user_ids
                                let data = {
                                    assignedAgents: data_agents.assigned,
                                    notAssignedAgents: data_agents.unassigned,
                                    campaign: newCamp
                                }
                                return res.send({
                                    status: 200,
                                    message: 'success',
                                    data: data
                                })
                            }).catch(err => {
                                return _this.sendResponseError(res, ['CannotGetAgents', err], 0, 403);
                            })
                        }).catch(err => {
                        return _this.sendResponseError(res, ['Kamailio error', err], 1, 403);
                    })
                } else {
                    return _this.sendResponseError(res, ['Campaign_notFound'], 1, 403);
                }
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['cannot fetch campaign', err], 1, 403);
            });
    }

    compareUUIDs(queue, db) {
        return new Promise((resolve, reject) => {
            const diffArray1 = queue.filter(str => !db.includes(str));
            const diffArray2 = db.filter(str => !queue.includes(str));

            if (diffArray1.length === 0 && diffArray2.length === 0) {
                resolve({message: 'equal'});
            } else if (diffArray1.length === 0) {
                resolve({message: 'db', data: diffArray2});
            } else if (diffArray2.length === 0) {
                resolve({message: 'queue', data: diffArray1});
            } else {
                resolve({message: 'both', data_queue: diffArray1, data_db: diffArray2});
            }
        });
    }

    updateUnafectedUsers(user_ids, campaign_agents, campaign_id) {
        return new Promise((resolve, reject) => {
            this.db['users'].update({
                updated_at: moment(new Date()),
                isAssigned: false,
                campaign_id: null
            }, {where: {user_id: user_ids}}).then(() => {
                const filteredIds = campaign_agents.filter((user_id) => !user_ids.includes(user_id));
                this.db['campaigns'].update({
                    updated_at: moment(new Date),
                    agents: filteredIds
                }, {where: {campaign_id: campaign_id}}).then(() => {
                    return resolve({ids: filteredIds})
                }).catch(err => reject(err))
            }).catch(err => reject(err))
        })
    }

    fixConsistency(queue_uuids, affected_agents_db, unnafected_agents_db, queue_uuid, campaign_agents, campaign_id) {
        return new Promise((resolve, reject) => {
            let affected_agents_uuids = affected_agents_db.map(agent => agent.sip_device.uuid);
            this.compareUUIDs(queue_uuids, affected_agents_uuids).then(data_result => {
                switch (data_result.message) {
                    case 'queue' : {
                        axios
                            .post(`${base_url_cc_kam}api/v1/queues/${queue_uuid}/tiers/delete`, {"agents": data_result.data}, call_center_authorization)
                            .then(() => {
                                return resolve({data: [], campaign_agents: campaign_agents})
                            }).catch(err => reject(err))
                    }
                        break;
                    case 'both' : {
                        axios
                            .post(`${base_url_cc_kam}api/v1/queues/${queue_uuid}/tiers/delete`, {"agents": data_result.data_queue}, call_center_authorization)
                            .then(() => {
                                const user_ids = affected_agents_db
                                    .filter(obj => data_result.data_db.includes(obj.sip_device.uuid))
                                    .map(obj => obj.user_id);
                                this.updateUnafectedUsers(user_ids, campaign_agents, campaign_id).then((data_camp_agents) => {
                                    return resolve({data: user_ids, campaign_agents: data_camp_agents.ids})
                                }).catch(err => reject(err))
                            }).catch(err => reject(err))
                    }
                        break;
                    case 'db' : {
                        const user_ids = affected_agents_db
                            .filter(obj => data_result.data.includes(obj.sip_device.uuid))
                            .map(obj => obj.user_id);
                        this.updateUnafectedUsers(user_ids, campaign_agents, campaign_id).then((data_camp_agents) => {
                            return resolve({data: user_ids, campaign_agents: data_camp_agents.ids})
                        }).catch(err => reject(err))
                    }
                        break;
                    default :
                        return resolve({data: [], campaign_agents: campaign_agents})
                }
            }).catch(err => reject(err))
        })
    }

    areEqualArrays(first, second) {
        if (first.length !== second.length) {
            return false;
        }
        for (let i = 0; i < first.length; i++) {
            if (!second.includes(first[i])) {
                return false;
            }
        }
        return true;
    }

    _addAgentsToQueue(tiers,queue_uuid,user_ids_toAdd,campaign_id){
        return new Promise((resolve,reject) => {
            if (tiers.tiers && tiers.tiers.length !== 0) {
                this.addToQueue(tiers, queue_uuid).then(() => {
                    this.updateIsAssignedStatus(user_ids_toAdd, campaign_id, true).then(() => {
                        resolve(true)
                    }).catch(err => reject(err))
                })
            }else{
                resolve(true)
            }

        })
    }

    assignAgents(req, res, next) {
        let _this = this;
        let {campaign_id, queue_uuid, assignedAgents, notAssignedAgents} = req.body;
        const ToAssign = assignedAgents.map(agent => agent.sip_device.uuid)
        axios
            .get(`${base_url_cc_kam}api/v1/queues/${queue_uuid}/tiers`, call_center_authorization)
            .then(data => {
                let queue_agents_uuids = data.data.result.map(el => el.agent_uuid);
                if (this.areEqualArrays(queue_agents_uuids, ToAssign)) {
                    return res.send({
                        status: 200,
                        message: 'success',
                        cannot_unassign: []
                    })
                }
                const toDelete = queue_agents_uuids.filter(uuid => !ToAssign.includes(uuid));
                let toDeleteAgents = notAssignedAgents.filter(obj => toDelete.includes(obj.sip_device.uuid))
                let UnassignAgents = toDeleteAgents.filter((agent) => agent.params.status !== 'waiting-call' && agent.params.status !== 'in_call')
                let ToReAssign = toDeleteAgents.filter((agent) => agent.params.status === 'waiting-call' || agent.params.status === 'in_call')
                let toAdd = ToAssign.filter(uuid => !queue_agents_uuids.includes(uuid));
                let agentsToAdd = assignedAgents.filter(obj => toAdd.includes(obj.sip_device.uuid))
                let toDeleteFromQueue = UnassignAgents.map(agent => agent.sip_device.uuid)

                let user_ids_toAdd = assignedAgents.filter(obj => toAdd.includes(obj.sip_device.uuid)).map(obj => obj.user_id);
                let user_ids_toDelete = UnassignAgents.map(obj => obj.user_id);
                let agents_ids_added = assignedAgents.map(obj => obj.user_id);
                this.deleteAgentsFromQueue(queue_uuid, toDeleteFromQueue)
                    .then(() => {
                        let tiers = {tiers: []};
                        if (toAdd && toAdd.length !== 0) {
                            let tiers_array = (toAdd && toAdd.length !== 0) ?
                                toAdd.map(uuid => ({
                                    agent_uuid: uuid,
                                    tier_level: 1,
                                    tier_position: 1
                                })) : [];
                            tiers = {tiers: tiers_array};
                        }
                        this._addAgentsToQueue(tiers,queue_uuid,user_ids_toAdd,campaign_id).then(() => {
                            this.db['campaigns'].update({agents: agents_ids_added}, {
                                where: {
                                    active: 'Y',
                                    campaign_id: campaign_id
                                }
                            }).then(() => {
                                this.updateIsAssignedStatus(user_ids_toDelete, null, false).then(() => {
                                    this.UpdateCampaign(agentsToAdd,UnassignAgents,campaign_id).then(() => {
                                        return res.send({
                                            status: 200,
                                            message: 'success',
                                            cannot_unassign: ToReAssign
                                        })
                                    }).catch(err => {return this.sendResponseError(res, ['cannotEmitUpdateAgents', err], 0, 403)})
                                }).catch(err => {return this.sendResponseError(res, ['cannotUpdateUsers', err], 0, 403)})
                            }).catch(err => {return this.sendResponseError(res, ['cannotUpdateCampaign', err], 0, 403)})
                        }).catch(err => {return this.sendResponseError(res, ['cannotAddToQueue', err], 0, 403)})
                    }).catch(err => {return this.sendResponseError(res, ['cannotDeleteQueueTiers', err], 0, 403)})
            }).catch(err => {return this.sendResponseError(res, ['cannotGetQueueTiers', err], 0, 403)})
    }

    updateIsAssignedStatus(agents_ids, campaign_id, isAssigned) {
        return new Promise((resolve, reject) => {
            if (agents_ids && agents_ids.length !== 0) {
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

    deleteAgentsFromQueue(queue_uuid, agents) {
        return new Promise((resolve, reject) => {
            if (agents && agents.length !== 0) {
                axios
                    .post(`${base_url_cc_kam}api/v1/queues/${queue_uuid}/tiers/delete`, {agents: agents}, call_center_authorization)
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

    UpdateCampaign(assignedAgents, NotAssignedAgents, campaign_id) {
        return new Promise((resolve, reject) => {
            const Assign = new Promise((resolve, reject) => {
                if (assignedAgents && assignedAgents.length !== 0) {
                    let idxAssign = 0;
                    assignedAgents.forEach((agent) => {
                        appSocket.emit('campaign_updated', {
                            campaign_id: campaign_id,
                            user_id: agent.user_id
                        });
                        if (idxAssign < assignedAgents.length - 1) {
                            idxAssign++
                        } else {
                            resolve(true)
                        }
                    })
                } else {
                    resolve(true);
                }

            });
            const UnAssign = new Promise((resolve, reject) => {
                if (NotAssignedAgents && NotAssignedAgents.length !== 0) {
                    let idxUnAssign = 0;
                    NotAssignedAgents.forEach((agent) => {
                        appSocket.emit('campaign_updated', {
                            campaign_id: null,
                            user_id: agent.user_id
                        });
                        if (idxUnAssign < NotAssignedAgents.length - 1) {
                            idxUnAssign++
                        } else {
                            resolve(true)
                        }
                    })
                } else {
                    resolve(true);
                }

            });
            Promise.all([Assign, UnAssign]).then(() => {
                resolve(true);
            }).catch((err) => reject(err));
        })
    }

    switchCampaignAgent(req, res, next) {
        let {user_id, campaign_id} = req.body;
        let updated_at = new Date();
        this.db.users.findOne({where: {user_id: user_id}}).then((response) => {
            let user = response.dataValues;
            let oldUuidAgent = user.sip_device.uuid;
            let oldCampaignId = user.campaign_id;
            if (campaign_id === oldCampaignId) {
                res.send({
                    success: true,
                    message: 'Done !'
                })
            } else {
                this.db.campaigns.findOne({where: {campaign_id: campaign_id}}).then((response) => {
                    let NewCampaign = response.dataValues;
                    let agents = NewCampaign.agents;
                    let NewCampaignUUidQueue = NewCampaign.params.queue.uuid;
                    let _agents = (agents ? agents : []);
                    _agents.push(user_id)
                    let tiers = {
                        tiers: [{
                            agent_uuid: oldUuidAgent,
                            tier_level: 1,
                            tier_position: 1
                        }]
                    };
                    this.addToQueue(tiers, NewCampaignUUidQueue).then(() => {
                        let dataUpdateUser = {
                            isAssigned: true,
                            campaign_id: campaign_id,
                            updated_at: updated_at,
                        }
                        this.db['users'].update(dataUpdateUser, {
                            where: {
                                user_id: user_id,
                                active: 'Y'
                            }
                        }).then(() => {
                            this.db.campaigns.update({agents: _agents, updated_at: updated_at}, {
                                where: {
                                    active: 'Y',
                                    campaign_id: campaign_id
                                }
                            }).then(() => {
                                if (oldCampaignId) {
                                    this.db.campaigns.findOne({where: {campaign_id: oldCampaignId}}).then((response) => {
                                        let oldCampaign = response.dataValues;
                                        let oldCampaignUuidQueue = oldCampaign.params.queue.uuid;
                                        let oldAgentsCamp = oldCampaign.agents;
                                        this.deleteAgentsFromQueue(oldCampaignUuidQueue, [oldUuidAgent]).then(() => {
                                            let index = oldAgentsCamp.indexOf(user_id);
                                            if (index !== -1) {
                                                oldAgentsCamp.splice(index, 1);
                                            }
                                            this.db.campaigns.update({agents: oldAgentsCamp, updated_at: updated_at}, {
                                                where: {
                                                    active: 'Y',
                                                    campaign_id: oldCampaign.campaign_id
                                                }
                                            }).then(() => {
                                                _agent_log_eventsbo.getLastEventParam(user, campaign_id).then((event) => {
                                                    res.send({
                                                        status: 200,
                                                        message: "success"
                                                    })
                                                }).catch(err => this.sendResponseError(res, ['ErrorCannotGetLastAction/EmitEvents'], 1, 403))
                                            }).catch((err) => {
                                                this.sendResponseError(res, ['Error.CannotUpdateOldCampaign'], 0, 403);
                                            })
                                        }).catch((err) => {
                                            this.sendResponseError(res, ['Error.CannotdeleteAgentFromQueue'], 0, 403);
                                        })
                                    }).catch((err) => {
                                        this.sendResponseError(res, ['Error.CannotFindOldCampaign'], 0, 403);
                                    })
                                } else {
                                    _agent_log_eventsbo.getLastEventParam(user, campaign_id).then((event) => {
                                        res.send({
                                            status: 200,
                                            message: "success"
                                        })
                                    }).catch(err => this.sendResponseError(res, ['ErrorCannotGetLastAction/EmitEvents'], 1, 403))
                                }
                            }).catch((err) => {
                                this.sendResponseError(res, ['Error.CannotUpdateNewCampaign'], 0, 403);
                            })
                        }).catch((err) => {
                            this.sendResponseError(res, ['Error.CannotUpdateUser'], 0, 403);
                        })
                    }).catch((err) => {
                        this.sendResponseError(res, ['Error.CannotAddAgentToQueue'], 0, 403);
                    })
                }).catch((err) => {
                    this.sendResponseError(res, ['Error.CannotFindNewCampaign'], 0, 403);
                })
            }

        }).catch((err) => {
            this.sendResponseError(res, ['Error.CannotFindUser'], 0, 403);
        })
    }

    //------------------> Generate Unique Username <-------------
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
                helpers.generateUsername()
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

    //--------------------> Clear Calls <-----------------------------
    clearCallsCampaign(req, res, next) {
        let {queue_uuid, campaign_id} = req.body
        if (!!!queue_uuid) {
            return this.sendResponseError(res, ['QueueUUID_IsRequired'], 0, 403)
        }
        if (!!!campaign_id) {
            return this.sendResponseError(res, ['campaign_id_IsRequired'], 0, 403)
        }
        axios
            .get(`${base_url_cc_kam}api/v1/queues/${queue_uuid}/clear`, call_center_authorization)
            .then(() => {
                this.db['campaigns'].update({
                    queue_count: 0
                },
                    {
                        where:{
                            campaign_id:campaign_id,
                            active: 'Y',
                            status: 'Y'
                        }
                    }).then(result=>{
                    return res.json({
                        success: true,
                        status: 200
                    })
                }).catch((err) => {
                    return this.sendResponseError(res, ['CannotUpdateCampaign', err], 1, 403)
                });

            })
            .catch((err) => {
                return this.sendResponseError(res, ['CannotClearCallsCampaign', err], 1, 403)
            });
    }

    //--------------------> Reset Hooper <------------------------------
    resetHooper(req, res, next) {
        let id = req.body.id
        let sqlQuerySelect = `update callfiles
                              set save_in_hooper = 'N'
                              where callfile_id IN (
                                  select h.callfile_id
                                  from hoopers as h
                                  where h.listcallfile_id IN (select list.listcallfile_id
                                                              from listcallfiles list
                                                              where list.campaign_id = :campaign_id))`

        db.sequelize['crm-app'].query(sqlQuerySelect, {
            type: db.sequelize['crm-app'].QueryTypes.UPDATE,
            replacements: {
                campaign_id: id
            }
        }).then(result => {
            let sqlQuery = `delete
                            from hoopers as h
                            where h.listcallfile_id IN (select list.listcallfile_id
                                                        from listcallfiles list
                                                        where list.campaign_id = :campaign_id)`

            db.sequelize['crm-app'].query(sqlQuery, {
                type: db.sequelize['crm-app'].QueryTypes.DELETE,
                replacements: {
                    campaign_id: id
                }
            }).then(result => {
                res.send({
                    success: true,
                })

            }).catch(err => {
                return this.sendResponseError(res, ['CannotResetHooper', err], 1, 403)
            })
        }).catch(err => {
            return this.sendResponseError(res, ['CannotResetHooper', err], 2, 403)
        })
    }

    getCampaignsByDID_ID(req, res, next) {
        let {did_id, account_id} = req.body;
        if (!!!did_id) {
            return this.sendResponseError(res, ['DID_ID is required'], 0, 403)
        }
        let sql = `SELECT campaign_name, campaign_type
                    FROM campaigns
                    WHERE 
                    active = :active AND 
                    account_id = :account_id AND 
                    config->'did_group_ids' @> :did_id ::jsonb;`

        db.sequelize['crm-app'].query(sql, {
            type: db.sequelize['crm-app'].QueryTypes.SELECT,
            replacements: {
                active: 'Y',
                account_id: account_id,
                did_id: '[' + did_id + ']'
            }
        }).then(campaigns => {
            res.send(campaigns)
        }).catch(err => {
            return this.sendResponseError(res, ['cannotFindCampaigns', err], 0, 403)
        })
    }


}

module.exports = campaigns;
