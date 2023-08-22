const {baseModelbo} = require('./basebo');
let db = require('../models');
const {default: axios} = require("axios");
let moment = require("moment");
const env = process.env.NODE_ENV || 'development';
const call_center_token = require(__dirname + '/../config/config.json')[env]["call_center_token"];
const base_url_cc_kam = require(__dirname + '/../config/config.json')[env]["base_url_cc_kam"];
const call_center_authorization = {
    headers: {Authorization: call_center_token}
};

const usersbo = require('./usersbo');
const callfilebo = require('./callfilebo');
const callhistorybo = require('./callhistorybo');
const messageDao = require('./messageDao');
const agent_log_eventsbo = require('./agent_log_eventsbo');
let _usersbo = new usersbo;
let _callfilebo = new callfilebo;
let _callhistorybo = new callhistorybo;
let _messageDao = new messageDao;
let _agent_log_eventsbo = new agent_log_eventsbo;
const appSocket = new (require('../providers/AppSocket'))();
const Op = require("sequelize/lib/operators");

class agents extends baseModelbo {
    constructor() {
        super('agents', 'user_id');
        this.baseModal = 'agents';
        this.primaryKey = 'user_id'
    }

    //----------------> Add Agent <------------------
    saveUserAgent(req, res, next) {
        let _this = this;
        let idx = 0;
        let {values, accountcode, bulkNum, account_id, isAgent = true} = req.body;
        if (!!!bulkNum) {
            _this.sendResponseError(res, ['Error.BulkNum is required'])
        } else {
            let sip_device = JSON.parse(JSON.stringify(values.sip_device));
            sip_device.created_at = moment().format("YYYY-MM-DD HH:mm:ss");
            sip_device.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");
            sip_device.status = "logged-out";
            sip_device.accountcode = accountcode;
            sip_device.enabled = true;
            values.sip_device = sip_device;
            this.db['roles_crms'].findOne({
                where: {value: isAgent ? 'agent' : 'user', active: 'Y'}
            }).then(role => {
                if (role) {
                    this.db['accounts'].findOne({
                        where: {account_id: account_id, active: 'Y'}
                    }).then(account_info => {
                        if (account_info) {
                            this.db['users'].findAll({
                                where: {role_crm_id: role.id, account_id: account_id, active: 'Y'}
                            }).then(data_agents => {
                                let agents_available = account_info.nb_agents - data_agents.length
                                if (agents_available && agents_available >= bulkNum.length) {
                                    this.bulkUserAgents(bulkNum, values.username, values, isAgent).then((users) => {
                                        if (!users.success) {
                                            res.send({
                                                success: false,
                                                status: 403,
                                                message: users.message
                                            })
                                        }
                                        let addAgent = new Promise((resolve, reject) => {
                                            users.data.forEach((user) => {
                                                this.saveOneUserAgent(user, isAgent)
                                                    .then(() => {
                                                        if (idx < users.length - 1) {
                                                            idx++
                                                        } else {
                                                            resolve({message: 'success'})
                                                        }
                                                    })
                                                    .catch(err => {
                                                        reject(err)
                                                    })
                                            })
                                        })
                                        Promise.all([addAgent]).then(() => {
                                            res.send({
                                                success: true,
                                                status: 200
                                            })
                                        }).catch((err) => {
                                            res.send({
                                                success: false,
                                                status: 403,
                                                message: "fail-catch"
                                            })
                                        })
                                    }).catch((err) => {
                                        return this.sendResponseError(res, ['Error.CannotBulkAgents'], 0, 403);
                                    })
                                } else {
                                    res.send({
                                        success: false,
                                        status: 403,
                                        data: [],
                                        agents_available: agents_available,
                                        message: "reach-limit-add-agents"
                                    })
                                }
                            }).catch((err) => {
                                return this.sendResponseError(res, ['Error.CannotFindUsers'], 0, 403);
                            })
                        } else {
                            return this.sendResponseError(res, ['Error.AccountNotFound'], 0, 403);
                        }
                    }).catch((err) => {

                        return this.sendResponseError(res, ['Error.CannotFindAccount'], 0, 403);
                    })
                } else {
                    return this.sendResponseError(res, ['Error.RoleCrmNotFound'], 0, 403);
                }
            }).catch((err) => {
                return this.sendResponseError(res, ['Error.CannotFindRoleCrm'], 0, 403);
            })
        }
    }

    bulkUserAgents(bulkNum, NewUserName, user, isAgent) {
        return new Promise((resolve, reject) => {
            let idx = 0;
            let arrayUsers = [];
            if (bulkNum.length === 1) {
                _usersbo.isUniqueUsername(NewUserName, 0, user.account_id).then(isUnique => {
                    if (!isUnique) {
                        resolve({
                            success: false,
                            message: 'username-exist'
                        });
                    } else {
                        resolve({
                            success: true,
                            data: [user]
                        });
                    }
                }).catch((err) => {
                    reject(err);
                })
            } else {
                let AgentRole = 'agent'
                if (isAgent) {
                    AgentRole = 'user'
                }
                _usersbo._generateUserName(user.account_id, AgentRole).then(userName => {
                    bulkNum.forEach((inc) => {
                        let parseUserName = parseInt(userName) + inc;
                        let TestuserName = parseUserName.toString();
                        _usersbo.isUniqueUsername(TestuserName, 0, user.account_id).then(isUnique => {
                            if (!isUnique) {
                                _usersbo._generateUserName(user.account_id, AgentRole).then(secondGenUserName => {
                                    TestuserName = parseInt(secondGenUserName) + 1;
                                    let pass = this.generatePassword()
                                    let newUser = {
                                        ...user,
                                        sip_device: {
                                            ...user.sip_device,
                                            username: secondGenUserName.toString(),
                                            password: pass
                                        },
                                        params: {
                                            ...user.params,
                                            pass_web: pass
                                        },
                                        username: secondGenUserName.toString(),
                                        first_name: secondGenUserName.toString(),
                                        password_hash: pass
                                    }
                                    arrayUsers.push(Object.assign({}, newUser));
                                    if (idx < bulkNum.length - 1) {
                                        idx++
                                    } else {
                                        resolve({
                                            success: true,
                                            data: arrayUsers
                                        })
                                    }
                                })
                            } else {
                                let pass = this.generatePassword()
                                let newUser = {
                                    ...user,
                                    sip_device: {
                                        ...user.sip_device,
                                        username: TestuserName.toString(),
                                        password: pass
                                    },
                                    params: {
                                        ...user.params,
                                        pass_web: pass
                                    },
                                    username: TestuserName.toString(),
                                    first_name: TestuserName.toString(),
                                    password_hash: pass
                                }

                                arrayUsers.push(Object.assign({}, newUser));
                                if (idx < bulkNum.length - 1) {
                                    idx++
                                } else {
                                    resolve({
                                        success: true,
                                        data: arrayUsers
                                    })
                                }

                            }

                        }).catch((err) => {
                            reject(err);
                        })
                    })
                }).catch((err) => {
                    reject(err);
                })
            }

        })
    }

    saveOneUserAgent(user, isAgent) {
        return new Promise((resolve, reject) => {
            let {domain, status, options, username} = user.sip_device;
            let name_agent = user.first_name + " " + user.last_name;
            let data_subscriber = {
                username: username || user.username,
                domain_uuid: user.domain.params.uuid,
                password: user.sip_device.password,
                domain
            }
            axios
                .post(`${base_url_cc_kam}api/v1/subscribers`,
                    data_subscriber,
                    call_center_authorization)
                .then((resp) => {
                    let result = resp.data.result;
                    let agent = {
                        name: name_agent,
                        domain_uuid: result.domain_uuid,
                        subscriber_uuid: result.uuid,
                        status,
                        options
                    };

                    axios
                        .post(`${base_url_cc_kam}api/v1/agents`, agent, call_center_authorization)
                        .then((resp) => {
                            let uuidAgent = resp.data.result.uuid || null;
                            let UserAgent = {
                                ...user,
                                sip_device: {
                                    ...user.sip_device,
                                    uuid: uuidAgent
                                }
                            }
                            _usersbo
                                .saveUserFunction(UserAgent)
                                .then(agent => {
                                    if (isAgent) {
                                        let user_id = agent.user_id;
                                        let dateNow = moment(new Date());
                                        let agentLog = {
                                            user_id: user_id,
                                            created_at: dateNow,
                                            updated_at: dateNow,
                                            start_at: dateNow,
                                        };
                                        let modalObj = this.db['agent_log_events'].build(agentLog)
                                        modalObj
                                            .save()
                                            .then(agent => {
                                                resolve(agent)
                                            })
                                            .catch(err => {
                                                reject(err)
                                            })
                                    } else {
                                        resolve(agent)
                                    }
                                })
                                .catch(err => {
                                    this.deleteSubScriberOrAgentByUUID(result.uuid, uuidAgent).then(() => {
                                        reject(err)
                                    }).catch(() => reject(err))
                                })
                        }).catch((err) => {
                        this.deleteSubScriberOrAgentByUUID(result.uuid, null).then(() => {
                            reject(err)
                        }).catch(() => reject(err))
                    })
                }).catch((err) => {
                reject(err)
            })
        })
    }

    updateSipDeviceUser(req,res,next){
        let {user_id , extension, password} = req.body
        if(!!!user_id || !!!extension || !!!password){
            return this.sendResponseError(res, ['Error.EmptyData'], 0, 403);
        }
        this.db['users'].findOne({
            where: {
                user_id: user_id
            }}).then(user => {
                if(user && Object.keys(user).length !== 0){
                    let {uuid} = user.sip_device
                    axios
                        .get(`${base_url_cc_kam}api/v1/agents/${uuid}`,
                            call_center_authorization)
                        .then((resp) => {
                            let {subscriber_uuid} = resp.data.result;
                            axios
                                .get(`${base_url_cc_kam}api/v1/subscribers/${subscriber_uuid}`,
                                    call_center_authorization)
                                .then((resp) => {
                                    let {domain_uuid, domain} = resp.data.result;
                                    let updateSub = {
                                        domain_uuid,
                                        domain,
                                        username: extension,
                                        password,
                                        updated_at: new Date(),
                                        effective_caller_id_name: extension,
                                        effective_caller_id_number: extension,
                                        outbound_caller_id_name: extension,
                                        outbound_caller_id_number: extension,
                                    }
                                    axios
                                        .put(`${base_url_cc_kam}api/v1/subscribers/${subscriber_uuid}`,
                                            updateSub,
                                            call_center_authorization)
                                        .then(() => {
                                            let newSipDevice = user.sip_device;
                                            newSipDevice.username = extension
                                            newSipDevice.password = password
                                            newSipDevice.updated_at = new Date()
                                            this.db["users"].update({
                                                sip_device: newSipDevice,
                                                updated_at : new Date()
                                            }, {where: {user_id: user_id, active: 'Y'}}).then(() => {
                                                return res.send({success : true})
                                            }).catch(err => {
                                                return this.sendResponseError(res, ['Error.cannotUpdateUser',err], 1, 403);
                                            })
                                        }).catch(err => {
                                        return this.sendResponseError(res, ['Error.cannotUpdateSubscriberUser',err], 2, 403);
                                    })
                                }).catch(err => {
                                return this.sendResponseError(res, ['Error.cannotGetSubscriberUser',err], 3, 403);
                            })
                        }).catch(err => {
                        return this.sendResponseError(res, ['Error.cannotGetTelcoAgentUser',err], 4, 403);
                    })
                }else{
                    return this.sendResponseError(res, ['Error.UserNotFound'], 5, 403);
                }
        }).catch(err => {
            return this.sendResponseError(res, ['Error.cannotGetUser',err], 6, 403);
        })

    }
    //---------------> Update Agent <----------------------
    updateAgent(req, res, next) {
        let _this = this;
        let values = req.body.values;
        let accountcode = req.body.accountcode;
        let {sip_device} = values;
        let {password, options, status, enabled, subscriber_id} = sip_device;
        let user_id = req.body.values.user_id;
        _usersbo.isUniqueUsername(values.username, user_id, values.account_id)
            .then(isUnique => {
                if (isUnique) {
                    this.db['users'].findOne({
                        where: {
                            user_id: user_id
                        }
                    }).then((resp) => {
                        let userData = resp.dataValues;
                        let {uuid} = userData.sip_device
                        axios
                            .get(`${base_url_cc_kam}api/v1/agents/${uuid}`,
                                call_center_authorization)
                            .then((resp) => {
                                let {subscriber_uuid} = resp.data.result;
                                axios
                                    .get(`${base_url_cc_kam}api/v1/subscribers/${subscriber_uuid}`,
                                        call_center_authorization)
                                    .then((resp) => {
                                        let {domain_uuid, domain} = resp.data.result;
                                        let updateSub = {
                                            domain_uuid,
                                            domain,
                                            username: values.username,
                                            password,
                                            updated_at: new Date()
                                        }
                                        axios
                                            .put(`${base_url_cc_kam}api/v1/subscribers/${subscriber_uuid}`,
                                                updateSub,
                                                call_center_authorization)
                                            .then((resp) => {
                                                let dataSub = resp.data.subscriber
                                                let update_Agent = {
                                                    name: values.first_name + " " + values.last_name,
                                                    domain_uuid: dataSub.domain_uuid,
                                                    subscriber_uuid: dataSub.uuid,
                                                    options: options,
                                                    updated_at: new Date(),
                                                    enabled: true
                                                }
                                                axios
                                                    .put(`${base_url_cc_kam}api/v1/agents/${uuid}`, update_Agent, call_center_authorization)
                                                    .then((resp) => {
                                                        let update_user = values;
                                                        let resultAgent = resp.data.agent;
                                                        update_user.sip_device = {
                                                            uuid,
                                                            status,
                                                            enabled,
                                                            options,
                                                            password,
                                                            username: values.username,
                                                            created_at: resultAgent.created_at,
                                                            updated_at: new Date(),
                                                            accountcode,
                                                            subscriber_id,
                                                            domain: values.sip_device.domain
                                                        };
                                                        update_user.updated_at = new Date();
                                                        _usersbo
                                                            .saveUserFunction(update_user)
                                                            .then(agent => {
                                                                res.send({
                                                                    status: 200,
                                                                    message: "success",
                                                                    data: agent,
                                                                    success: true
                                                                })
                                                            })
                                                            .catch(err => {
                                                                return _this.sendResponseError(res, ['Error.CannotUpdateUserDB', err], 1, 403);
                                                            })
                                                    }).catch((err) => {
                                                    return _this.sendResponseError(res, ['Error.CannotUpdateAgent'], 2, 403);
                                                })
                                            }).catch((err) => {
                                            return _this.sendResponseError(res, ['Error.CannotUpdateSubscriber'], 3, 403);
                                        })
                                    }).catch((err) => {
                                    return _this.sendResponseError(res, ['Error.CannotGetSubscriber'], 4, 403);
                                })
                            }).catch((err) => {
                            return _this.sendResponseError(res, ['Error.CannotGetAgent'], 5, 403);
                        })
                    }).catch((err) => {
                        return _this.sendResponseError(res, ['Error.CannotFindUser'], 6, 403);
                    })
                } else {
                    res.send({
                        status: 403,
                        success: false,
                        message: 'username-exist'
                    });
                }
            }).catch((err) => {
            return _this.sendResponseError(res, ['Error.UsernameNotUnique'], 7, 403);
        })

    }

    //----------------> Delete Agent <-------------------------
    deleteAgent(req, res, next) {
        let _this = this;
        let agent_id = req.body.user_id;
        _messageDao.deleteMessageCascade([{user_id: agent_id}]).then(() => {
            this.deleteAgentWithSub(agent_id, true)
                .then(() => {
                    res.send({
                        succes: 200,
                        message: "Agent has been deleted with success"
                    })
                })
                .catch((err) => {
                    return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
                });
        }).catch(err => {
            return _this.sendResponseError(res, ['Error.CannotDeleteMessages', err], 1, 403);
        })

    }

    deleteAgentWithSub(user_id, isNotSuperAdmin) {
        return new Promise((resolve, reject) => {
            if (isNotSuperAdmin) {
                this.db['users'].findOne({
                    where: {
                        user_id: user_id,
                        active: 'Y'
                    }
                }).then((result) => {
                    let {uuid} = result.dataValues.sip_device;
                    if (!!!uuid) {
                        reject(false);
                    }
                    axios
                        .get(`${base_url_cc_kam}api/v1/agents/${uuid}`, call_center_authorization).then((resp_agent) => {
                        let {subscriber_uuid} = resp_agent.data.result;
                        axios
                            .delete(`${base_url_cc_kam}api/v1/agents/${uuid}`, call_center_authorization).then((resp) => {
                            axios
                                .get(`${base_url_cc_kam}api/v1/subscribers/${subscriber_uuid}`, call_center_authorization).then((resp_sub) => {
                                axios
                                    .delete(`${base_url_cc_kam}api/v1/subscribers/${subscriber_uuid}`, call_center_authorization).then((resp) => {
                                    this.updateUserToken(user_id, 'delete').then(() => {
                                        this.db['meetings'].update({active: 'N'}, {
                                            where: {
                                                $or: [
                                                    {
                                                        agent_id: user_id
                                                    },
                                                    {
                                                        sales_id: user_id
                                                    }
                                                ]
                                            }
                                        })
                                            .then(() => {
                                                resolve(true);
                                            })
                                            .catch((err) => {
                                                reject(err);
                                            });
                                    }).catch(err => {
                                        reject(err)
                                    })
                                }).catch((err) => {
                                    reject(err);
                                })
                            }).catch((err) => {
                                reject(err);
                            })
                        }).catch((err) => {
                            reject(err);
                        })
                    }).catch((err) => {
                        reject(err);
                    })
                }).catch((err) => {
                    reject(err);
                })
            } else {
                resolve(true)
            }

        })
    }

    //-----------------> change Status <-----------------------------
    changeStatus(req, res, next) {
        let {user_id, status} = req.body;
        if ((!!!user_id || !!!status)) {
            return this.sendResponseError(res, ['Error.RequestDataInvalid'], 0, 403);
        }
        if (status !== 'N' && status !== 'Y') {
            return this.sendResponseError(res, ['Error.StatusMustBe_Y_Or_N'], 0, 403);
        }
        this.db['users'].findOne({
            where: {
                user_id: user_id
            }
        }).then((user) => {
            let sip_device = user.dataValues.sip_device;
            let {uuid} = sip_device;
            axios
                .get(`${base_url_cc_kam}api/v1/agents/${uuid}`, call_center_authorization).then((resp_agent) => {
                let data_update = resp_agent.data.result;
                data_update.enabled = status === 'Y';
                data_update.updated_at = new Date();
                axios
                    .put(`${base_url_cc_kam}api/v1/agents/${uuid}`, data_update, call_center_authorization).then((resp) => {
                    sip_device.enabled = status === 'Y';
                    sip_device.updated_at = new Date();
                    this.updateUserToken(user_id, status, sip_device).then(() => {
                        res.send({
                            status: 200,
                            message: "success",
                            success: true
                        })
                    }).catch(err => {
                        return this.sendResponseError(res, ['Error.CannotUpdateUser'], 0, 403);
                    });
                }).catch((err) => {
                    return this.sendResponseError(res, ['Error.CannotUpdateTelcoAgent'], 0, 403);
                })
            }).catch((err) => {
                return this.sendResponseError(res, ['Error.CannotFindAgentTelco'], 0, 403);
            })
        }).catch((err) => {
            return this.sendResponseError(res, ['Error.CannotFindUser'], 0, 403);
        })
    }

    _getDomainNameByUUIDorName(domain) {
        return new Promise((resolve, reject) => {
            let sql_get_domain = `SELECT domain_name
                    FROM domains
                    WHERE 
                    active = :active AND
                    (domain_name = :domain OR params->>'uuid' = :domain);
            `
            db.sequelize['crm-app'].query(sql_get_domain, {
                type: db.sequelize['crm-app'].QueryTypes.SELECT,
                replacements: {
                    active: 'Y',
                    domain: domain
                }
            }).then(domain => {
                if (domain && domain.length !== 0) {
                    return resolve({
                        success: true,
                        name: domain[0].domain_name
                    })
                } else {
                    return resolve({
                        success: false,
                        message: 'domain not found'
                    })
                }
            }).catch(err => {
                reject(err)
            })
        })
    }

    _getAgentByExtensionAndDomainUUID(extension, domain_name) {
        return new Promise((resolve, reject) => {
            let sql_get_agent = `SELECT *
                    FROM users
                    WHERE 
                    active = :active AND
                    sip_device->>'domain' = :domain_name AND
                    sip_device->>'username' = :extension;
            `
            db.sequelize['crm-app'].query(sql_get_agent, {
                type: db.sequelize['crm-app'].QueryTypes.SELECT,
                replacements: {
                    active: 'Y',
                    domain_name: domain_name,
                    extension: extension
                }
            }).then(agent => {
                if (agent && agent.length !== 0) {
                    return resolve({
                        success: true,
                        agent: agent
                    })
                } else {
                    return resolve({
                        success: false,
                        message: 'agent not found'
                    })
                }
            }).catch(err => {
                reject(err)
            })
        })
    }

    disconnectTelco(req, res, next) {
        let _this = this;
        let {extension, domain} = req.body;
        if (!!!extension || !!!domain) {
            return _this.sendResponseError(res, ['EmptyFields'], 1, 403);
        }
        this._getDomainNameByUUIDorName(domain).then(domain_response => {
            if (domain_response.success) {
                let DomainName = domain_response.name
                this._getAgentByExtensionAndDomainUUID(extension, DomainName).then(agent_response => {
                    if (agent_response.success) {
                        let agentData = agent_response.agent[0]
                        let dataConnexion = {
                            user_id: agentData.user_id,
                            uuid: agentData.sip_device.uuid,
                            crmStatus: 'connected',
                            telcoStatus: 'logged-out',
                            pauseStatus: null,
                            call_type: null
                        }
                        this._onConnect(dataConnexion).then(connexion_response => {
                            if (connexion_response.success) {
                                return res.send({
                                    status: 200,
                                    message: 'success'
                                })
                            } else {
                                return res.send({
                                    status: 403,
                                    message: connexion_response.message
                                })
                            }
                        }).catch(err => {
                            return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
                        })
                    } else {
                        return res.send({
                            status: 403,
                            success: false,
                            message: agent_response.message
                        })
                    }
                })
            } else {
                return res.send({
                    status: 403,
                    success: false,
                    message: domain_response.message
                })
            }

        })
    }

    //-----------------> Telco Agent <------------------------
    _onConnect(data) {
        return new Promise((resolve, reject) => {
            let {user_id, uuid, crmStatus, telcoStatus, pauseStatus, call_type} = data;
            this.onConnectFunc(user_id, uuid, crmStatus, telcoStatus, pauseStatus)
                .then((user) => {
                    if (user.success) {
                        let {sip_device, first_name, last_name, user_id, campaign_id, account_id} = user.agent.user;
                        let data_agent = {
                            user_id: user_id,
                            first_name: first_name,
                            last_name: last_name,
                            uuid: sip_device.uuid,
                            crmStatus: user.agent.user.params.status,
                            telcoStatus: sip_device.status,
                            timerStart: sip_device.updated_at,
                            campaign_id: campaign_id,
                            account_id: account_id,
                            call_type: call_type
                        };
                        appSocket.emit('agent_connection', data_agent);
                        return resolve({
                            success: true,
                            status: 200,
                            message: 'success'
                        })
                    } else {
                        if (user.status === 403) {
                            return resolve({
                                success: false,
                                message: user.message || 'idk'
                            })
                        }
                        return resolve({
                            success: true,
                            status: 200,
                            message: user.message || "something wrong"
                        })
                    }

                })
                .catch((err) => {
                    reject(err)
                });
        })
    }

    onConnect(req, res, next) {
        let _this = this;
        this._onConnect(req.body).then(data => {
            if (data.success) {
                return res.send({
                    status: 200,
                    message: 'success'
                })
            } else {
                return res.send({
                    status: 403,
                    message: data.message
                })
            }
        }).catch(err => {
            return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
        })

    }

    _getUserByUUID = (uuid) => {
        return new Promise((resolve, reject) => {
            let sql_get_user = `SELECT *
                    FROM users
                    WHERE 
                    active = :active AND
                    sip_device->>'uuid' = :uuid LIMIT :limit;
            `
            db.sequelize['crm-app'].query(sql_get_user, {
                type: db.sequelize['crm-app'].QueryTypes.SELECT,
                replacements: {
                    active: 'Y',
                    uuid: uuid,
                    limit: 1
                }
            }).then(user => {
                if (user && user.length !== 0) {
                    return resolve({
                        user: user[0]
                    })
                } else {
                    return reject('user not found')
                }
            }).catch(err => {
                return reject(err)
            })
        })
    }

    onConnectFunc(user_id, uuid, crmStatus, telcoStatus, pauseStatus = null) {
        return new Promise((resolve, reject) => {
            this._getUserByUUID(uuid).then(userData => {
                let user = userData.user
                if(!!!user.current_session_token && crmStatus !== 'logged-out'){
                    return resolve({
                        success: false,
                        status: 200,
                        message: 'user without token'
                    })
                }
                _agent_log_eventsbo._getLastEvent(user.user_id).then(ALE => {
                    const action_name = ALE.data.dataValues.action_name;
                    if (action_name === crmStatus) {
                        return resolve({
                            success: false,
                            status: 200,
                            message: 'status already exists'
                        })
                    }
                    if (uuid) {
                        this.OnConnectTelco(uuid, telcoStatus).then(() => {
                            let params = user.params;
                            user.updated_at = moment(new Date());
                            this.updateAgentStatus(user.user_id, user, telcoStatus, crmStatus, params, pauseStatus)
                                .then(agent => {
                                    if (agent.success) {
                                        return resolve({
                                            success: true,
                                            agent: agent,
                                            status: 200,
                                            message: 'status changed !'
                                        });
                                    } else {
                                        return resolve({
                                            success: false,
                                            status: 403,
                                            message: 'agent not updated !'
                                        });
                                    }
                                })
                                .catch((err) => {
                                    reject(err);
                                });
                        })
                    } else {
                        reject(false)
                    }
                })
            }).catch((err) => {
                reject(err);
            });
        })
    }

    updateAgentStatus(user_id, agent_, telcoStatus, crmStatus, params, pauseStatus) {
        let updatedAt_tz = moment(new Date());
        return new Promise((resolve, reject) => {
            let agent;
            let sip_device = agent_.sip_device;
            if (telcoStatus) {
                sip_device.status = telcoStatus;
                sip_device.updated_at = updatedAt_tz;
            }
            agent = {user_id: user_id, sip_device: sip_device, params: params};
            agent.params.status = crmStatus;
            this.db['users'].update(agent, {
                where: {user_id: user_id},
                returning: true,
                plain: true
            })
                .then(data_user => {
                    if (data_user) {
                        this.db['agent_log_events'].findAll({
                            where: {
                                user_id: user_id,
                                finish_at: null
                            },
                            order: [['start_at', 'DESC']]
                        }).then(result => {
                            if (result && result.length !== 0) {
                                let ids_agents_log_event = result.map(log => log.agent_log_event_id)
                                this.db['agent_log_events'].update({
                                        finish_at: updatedAt_tz,
                                        updated_at: updatedAt_tz
                                    },
                                    {
                                        where: {
                                            agent_log_event_id: ids_agents_log_event
                                        },
                                        returning: true,
                                        plain: true
                                    }
                                ).then(() => {
                                        this.db['agent_log_events'].build({
                                            user_id: user_id,
                                            action_name: agent.params.status,
                                            created_at: updatedAt_tz,
                                            updated_at: updatedAt_tz,
                                            start_at: updatedAt_tz,
                                            pause_status_id: agent.params.status === 'on-break' ? pauseStatus : null
                                        }).save().then(agent_event => {
                                            resolve({
                                                success: true,
                                                data: agent_event,
                                                user: data_user[1]
                                            })

                                        }).catch(err => {
                                            reject(err)
                                        })
                                }).catch(err => {
                                    reject(err)
                                })
                            } else {
                                this.db['agent_log_events'].build({
                                    user_id: user_id,
                                    action_name: agent.params.status,
                                    created_at: updatedAt_tz,
                                    updated_at: updatedAt_tz,
                                    start_at: updatedAt_tz
                                }).save().then(agent_event => {
                                    resolve({
                                        success: true,
                                        data: agent_event,
                                        user: data_user[1]
                                    })

                                }).catch(err => {
                                    reject(err)
                                })
                            }
                        }).catch(err => {
                            reject(err)
                        })
                    } else {
                        resolve({
                            success: false
                        })
                    }

                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    //----------------> Dashboard Admin <------------------------------
    getConnectedAgents(req, res, next) {
        let _this = this;
        let {account_id, roleCrmAgent} = req.body;
        let where = {
            active: 'Y',
            account_id: account_id,
            role_crm_id: roleCrmAgent,
            current_session_token: {[Op.not]: null}
        }
        this.db['users'].findAll({where: where})
            .then(agents => {
                this.verifyTokenAgents(agents).then((result) => {
                    res.send({
                        status: "200",
                        message: "success",
                        data: result
                    })
                }).catch(err => {
                    return _this.sendResponseError(res, ['Error.cannotVerifyToken', err], 1, 403);
                })
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Error.cannot fetch list agents', err], 1, 403);
            })
    }

    verifyTokenAgents(agents) {
        return new Promise((resolve, reject) => {
            let idx = 0;
            if (agents && agents.length !== 0) {
                let Users = []
                agents.forEach(user => {
                    // _usersbo.verifyTokenParam(user.current_session_token).then((res) => {
                    //     if (res === true) {
                    let {sip_device, first_name, last_name, user_id, campaign_id, channel_uuid, updated_at} = user;
                    this.db['agent_log_events'].findAll({
                        where: {active: 'Y', user_id: user_id},
                        order: [['agent_log_event_id', 'DESC']]
                    })
                        .then(events => {
                            if (events && events.length !== 0 && events[0].action_name !== 'logged-out') {
                                Users.push({
                                    user_id: user_id,
                                    first_name: first_name,
                                    last_name: last_name,
                                    uuid: sip_device.uuid,
                                    crmStatus: user.params.status,
                                    telcoStatus: sip_device.status,
                                    timerStart: events[0].start_at,
                                    campaign_id: campaign_id,
                                    extension: sip_device.username,
                                    channel_uuid: channel_uuid,
                                    updated_at: updated_at
                                });
                            }
                            if (idx < agents.length - 1) {
                                idx++;
                            } else {
                                resolve(Users);
                            }
                        })
                        .catch(err => {
                            reject(err)
                        })

                    // } else {
                    //     let toUpdate = {
                    //         channel_uuid: null,
                    //         updated_at: moment(new Date()),
                    //         current_session_token: null
                    //     }
                    //     this.db['users'].update(toUpdate, {where: {user_id: user.user_id}}).then(() => {
                    //         idx++;
                    //     }).catch(err => {
                    //         reject(err)
                    //     })
                    // }
                    // }).catch(err => reject(err))
                })
            } else {
                resolve([]);
            }
        })
    }

    filterDashboard(req, res, next) {
        let _this = this;
        let {account_id, campaign_id, agent_id, status, roleCrmAgent} = req.body;
        let where = {
            active: 'Y',
            account_id: account_id,
            role_crm_id: roleCrmAgent,
            current_session_token: {[Op.not]: null}
        }

        if (campaign_id) {
            where.campaign_id = campaign_id;
        }

        if (agent_id) {
            where.user_id = agent_id;
        }

        if (status) {
            where.params = {"status": status === "in_qualification" ? 'waiting-call' : status}
        }
        if (status === 'in_qualification') {
            where.channel_uuid = {[Op.not]: null}
        }
        this.db['users'].findAll({where: where})
            .then(agents => {
                this.verifyTokenAgents(agents).then((result) => {
                    this.TrieStats(result).then(trited_stats => {
                        res.send({
                            status: "200",
                            message: "success",
                            data: trited_stats
                        })
                    }).catch(err => {
                        return _this.sendResponseError(res, ['Error.cannotVerifyToken', err], 1, 403);
                    })

                }).catch(err => {
                    return _this.sendResponseError(res, ['Error.cannotVerifyToken', err], 1, 403);
                })

            }).catch(err => {
            return _this.sendResponseError(res, ['Error.cannot fetch list agents', err], 1, 403);
        })
    }

    TrieStats(agents) {
        return new Promise((resolve, reject) => {
            let inCall = []
            let waitingCall = []
            let inQualification = []
            let onBreak = []
            let manual = []
            let connected = []
            agents.forEach(item_ag => {
                switch (item_ag.crmStatus) {
                    case 'in_call':
                        inCall.push(item_ag)
                        break
                    case 'waiting-call':
                        item_ag.channel_uuid ? inQualification.push(item_ag) : waitingCall.push(item_ag)
                        break
                    case 'on-break':
                        onBreak.push(item_ag)
                        break
                    case 'manual':
                        manual.push(item_ag)
                        break
                    case 'connected':
                        connected.push(item_ag)
                        break
                }
            })
            inCall.sort((a, b) => a.timerStart - b.timerStart)
            waitingCall.sort((a, b) => a.timerStart - b.timerStart)
            inQualification.sort((a, b) => a.timerStart - b.timerStart)
            onBreak.sort((a, b) => a.timerStart - b.timerStart)
            manual.sort((a, b) => a.timerStart - b.timerStart)
            connected.sort((a, b) => a.timerStart - b.timerStart)
            let Stats = inCall.concat(waitingCall, inQualification, onBreak, manual, connected)
            resolve(Stats)
        })
    }

    onDisconnect(item) {
        return new Promise((resolve, reject) => {
            this.onConnectFunc(item.user_id, item.uuid, 'connected', 'logged-out')
                .then((user) => {
                    if (user.success) {
                        let {sip_device, first_name, last_name, user_id, account_id, campaign_id} = user.agent.user;
                        let data_agent = {
                            user_id: user_id,
                            first_name: first_name,
                            last_name: last_name,
                            uuid: sip_device.uuid,
                            crmStatus: user.agent.user.params.status,
                            telcoStatus: sip_device.status,
                            timerStart: sip_device.updated_at,
                            account_id: account_id,
                            campaign_id: campaign_id
                        };
                        appSocket.emit('agent_connection', data_agent);
                        return resolve(true)
                    } else {
                        return resolve(true)
                    }
                }).catch((err) => {
                reject(err)
            });
        })
    }

    onDisconnectAgents(req, res, next) {
        let data_agent = req.body.data
        let i = 0;
        if (data_agent.length === 0) {
            return this.sendResponseError(res, ['Error.AnErrorHasOccurredUser'], 1, 403);
        }
        const promiseDisconnect = new Promise((resolve, reject) => {
            let couldDisc = data_agent.filter((agent) => agent.crmStatus !== 'waiting-call' && agent.crmStatus !== 'in_call' && agent.crmStatus !== 'in_qualification') || [];
            let cannotDisc = data_agent.filter((agent) => agent.crmStatus === 'waiting-call' || agent.crmStatus === 'in_call' || agent.crmStatus === 'in_qualification') || [];
            if (couldDisc && couldDisc.length !== 0) {
                couldDisc.forEach(item => {
                    this.onDisconnect(item).then(result => {
                        if (result) {
                            if (i < data_agent.length - 1) {
                                i++;
                            } else {
                                resolve({
                                    success: true,
                                    data: cannotDisc
                                })
                            }
                        } else {
                            reject({
                                success: false
                            })
                        }
                    })

                })
            } else {
                resolve({success: true, data: cannotDisc})
            }

        })
        Promise.all([promiseDisconnect]).then(result => {
            if (result) {
                res.send({
                    status: 200,
                    message: 'success',
                    data: result[0].data
                })
            } else {
                return this.sendResponseError(res, ['Error.cannot fetch list agents'], 1, 403);
            }
        })
    }

    _logoutAgent(user_id) {
        return new Promise((resolve, reject) => {
            if (!!!user_id) {
                return reject('user not found !')
            }
            this.db['users'].findOne({where: {user_id: user_id}}).then((user) => {
                if (user && Object.keys(user) && Object.keys(user).length !== 0) {
                    this.db['users'].update({
                        current_session_token: null,
                        updated_at: moment(new Date())
                    }, {where: {user_id: user_id}}).then(() => {
                        this.onConnectFunc(user.user_id, user.sip_device.uuid, 'logged-out', 'logged-out').then(() => {
                            if (user.success) {
                                appSocket.emit('reload.Permission', {
                                    user_id: user.user_id
                                });
                                return resolve({
                                    status: 200,
                                    success: true
                                })
                            } else {
                                return resolve({
                                    status: 200,
                                    success: true
                                })
                            }

                        }).catch((err) => {
                            reject('cannotChangeStatusAgentToLoggedOut', err)
                        })
                    }).catch((err) => {
                        reject('cannotUpdateAgent', err)
                    })
                } else {
                    reject('AgentNotFound')
                }
            }).catch((err) => {
                reject('AgentNotFound', err)
            })
        })
    }

    logoutAgent(req, res, next) {
        let {user_id} = req.body;
        this._logoutAgent(user_id).then(data => {
            res.json(data)
        }).catch(err => {
            this.sendResponseError(res, ['Error.', err], 0, 403)
        })
    }

    disconnectAgentsByAccountID(req, res, next) {
        let account_id = req.body.account_id;
        this.db['roles_crms'].findOne({where: {value: 'agent'}}).then(role => {
            let sql = `select user_id
                    FROM users
                    WHERE 
                    WHERE_CONDITION
                    sip_device->>'status' <> :status;`
            let where_condition = ''

            if (account_id) {
                where_condition += ' account_id = :account_id AND '
            }
            where_condition += 'active = :active AND role_crm_id = :role_crm_id AND'
            sql = sql.replace('WHERE_CONDITION', where_condition)
            db.sequelize['crm-app'].query(sql, {
                type: db.sequelize['crm-app'].QueryTypes.SELECT,
                replacements: {
                    active: 'Y',
                    account_id: account_id,
                    role_crm_id: role.id,
                    status: 'logged-out'
                }
            }).then(users => {
                if (users && users.length !== 0) {
                    let users_ids = users.map(u => u.user_id);
                    let idx = 0;
                    users_ids.forEach(user_id => {
                        appSocket.emit('destroy_session', {user_id: user_id, logged_out: true})
                        if (idx < users_ids.length - 1) {
                            idx++;
                        } else {
                            res.send({
                                status: 200,
                                success: true
                            })
                        }
                    })
                } else {
                    res.send({
                        status: 200,
                        success: true
                    })
                }
            }).catch(err => {
                return this.sendResponseError(res, ['cannotGetUsers', err], 0, 403)
            })
        })
    }

    //---------------> Report <---------------------

    //------- Agent Details Report -------- //
    agentDetailsReports(req, res, next) {
        const filter = req.body || null;
        let {
            agent_ids,
            listCallFiles_ids,
            dateSelected_to,
            dateSelected_from,
            start_time,
            end_time,
            campaign_ids
        } = filter
        let dataSelect_from = moment(dateSelected_from).format('YYYY-MM-DD').concat(' ', start_time)
        let dataSelect_to = moment(dateSelected_to).format('YYYY-MM-DD').concat(' ', end_time)
        this.DataCallsAgents(agent_ids, listCallFiles_ids, dataSelect_from, dataSelect_to, campaign_ids).then(data_call => {
            let FilteredUsers_ids = [];
            data_call.map(user => FilteredUsers_ids.push(user.agent_id))
            this.DataActionAgents(FilteredUsers_ids, dataSelect_from, dataSelect_to).then(data_actions => {
                this.formatUsers(FilteredUsers_ids).then(Users => {
                    let AllUsers = Users.data;
                    AllUsers.map(item => {
                        let index_idUser = data_call.findIndex(item_call => item_call.agent_id === item.user_id);
                        if (index_idUser !== -1) {
                            item.Number_of_call = data_call[index_idUser].totalcalls;
                            item.Talking_Duration = data_call[index_idUser].durationcalls;
                            item.AVG_Talking_Duration = data_call[index_idUser].moy;

                        } else {
                            item.Number_of_call = '0';
                            item.Talking_Duration = '0';
                            item.AVG_Talking_Duration = '0';
                        }
                        let action = []
                        data_actions.map(item_action => {
                            if (item_action.user_id === item.user_id) {
                                action.push({
                                    action_name: item_action.action_name,
                                    duration: item_action.sum,
                                    count_break: item_action.count
                                })
                            }
                            item.data_action = action
                        })
                    })
                    res.send({
                        success: true,
                        data: AllUsers
                    })
                })

            }).catch(err => {
                return this.sendResponseError(res, ['Error.cannot fetch list agents1', err], 1, 403);
            })

        }).catch(err => {
            return this.sendResponseError(res, ['Error.cannot fetch list agents2', err], 1, 403);
        })

    }

    DataCallsAgents(agent_ids, list_CallFile_ids, start_time, end_time, campaign_ids) {
        return new Promise((resolve, reject) => {
            let sqlData = `select count(DISTINCT CallH.id)                  as TotalCalls,
                                  AVG(CallH.finished_at - CallH.started_at) AS moy,
                                  SUM(CallH.dmc)                            AS DurationCalls,
                                  CallH.agent_id
                           from calls_historys as CallH
                                    left join callfiles as CallF On CallF.callfile_id = CallH.call_file_id
                                    left join listcallfiles as listCallF
                                              On CallF.listcallfile_id = listCallF.listcallfile_id
                               EXTRA_WHERE
                           GROUP BY agent_id`;
            let extra_where_count = '';
            if (agent_ids && agent_ids.length !== 0) {
                extra_where_count += 'AND agent_id in (:user_ids) '
            }
            if (start_time && start_time !== '') {
                extra_where_count += 'AND started_at >= :started_at ';
            }
            if (end_time && end_time !== '') {
                extra_where_count += 'AND finished_at <=  :finished_at ';
            }
            if (list_CallFile_ids && list_CallFile_ids.length !== 0) {
                extra_where_count += 'AND listCallF.listcallfile_id in (:listCallFile_ids) ';
            }
            if (campaign_ids && campaign_ids.length !== 0) {
                extra_where_count += 'AND listCallF.campaign_id in (:campaign_ids) ';
            }
            if (extra_where_count !== '') {
                extra_where_count = extra_where_count.replace('AND', 'WHERE');
            }

            sqlData = sqlData.replace('EXTRA_WHERE', extra_where_count);
            db.sequelize['crm-app'].query(sqlData, {
                type: db.sequelize['crm-app'].QueryTypes.SELECT,
                replacements: {
                    started_at: start_time,
                    finished_at: end_time,
                    user_ids: agent_ids,
                    listCallFile_ids: list_CallFile_ids,
                    campaign_ids: campaign_ids
                }
            }).then(result => {
                if (result && result.length !== 0) {
                    result.map(res => {
                        res.durationcalls = parseInt(res.durationcalls);
                        res.totalcalls = parseInt(res.totalcalls);
                    })
                }
                resolve(result)
            }).catch(err => {
                reject(err)
            })
        })
    }

    DataActionAgents(agent_id, start_time, end_time) {
        return new Promise((resolve, reject) => {
            if (agent_id && agent_id.length !== 0) {
                let sql = `select agent_log.user_id,
                                  agent_log.action_name,
                                  SUM(agent_log.finish_at - agent_log.start_at),
                                  COUNT(agent_log.action_name)
                           from agent_log_events as agent_log
                           where agent_log.user_id in (:agent_id)
                             AND (agent_log.action_name = 'on-break' OR agent_log.action_name = 'waiting-call' OR
                                  agent_log.action_name = 'in_call')
                             AND agent_log.start_at >= :start_at
                             AND agent_log.finish_at <= :finish_at
                           GROUP BY agent_log.action_name, agent_log.user_id `
                db.sequelize['crm-app'].query(sql, {
                    type: db.sequelize['crm-app'].QueryTypes.SELECT,
                    replacements: {
                        agent_id: agent_id,
                        start_at: start_time,
                        finish_at: end_time
                    }
                }).then(result => {
                    resolve(result)
                }).catch(err => {
                    reject(err)
                })
            } else {
                resolve([])
            }
        })
    }

    // --------- List Call File Reports ---------- //
    listCallFileReports(req, res, next) {
        let _this = this;
        const params = req.body;
        let {
            account_id,
            agent_ids,
            call_status,
            dataAgents,
            campaign_ids,
            dateSelected_from,
            dateSelected_to,
            listCallFiles_ids,
            roleCrmAgent
        } = params;
        this.getUsers(agent_ids, campaign_ids, roleCrmAgent, account_id).then(result => {
            dataAgents = result.dataAgents;
            agent_ids = result.users_ids;
            dateSelected_from = moment(dateSelected_from).format('YYYY-MM-DD');
            dateSelected_to = moment(dateSelected_to).format('YYYY-MM-DD');
            let promiseParams = new Promise((resolve, reject) => {
                if (campaign_ids && campaign_ids.length !== 0 && listCallFiles_ids && listCallFiles_ids.length === 0) {
                    this.db['listcallfiles'].findAll({
                        where: {
                            active: 'Y',
                            campaign_id: {
                                $in: campaign_ids
                            }
                        }
                    }).then((listCallFiles) => {
                        listCallFiles_ids = listCallFiles.map(item_camp => item_camp.listcallfile_id)
                        if (call_status && call_status.length === 0) {
                            this.db['callstatuses'].findAll({
                                where: {
                                    active: 'Y',
                                    $or: [
                                        {
                                            is_default:
                                                {
                                                    $eq: "Y"
                                                }
                                        },
                                        {
                                            campaign_id: {
                                                $in: campaign_ids
                                            },
                                        }
                                    ]
                                }
                            }).then((call_status_list) => {
                                call_status = call_status_list.map(item_cal => item_cal.callstatus_id);
                                return resolve({
                                    ...params,
                                    call_status: call_status,
                                    listCallFiles_ids: listCallFiles_ids
                                })
                            })
                        } else {
                            return resolve({...params, listCallFiles_ids: listCallFiles_ids})

                        }
                    }).catch(err => {
                        reject(err);
                    })
                } else {
                    this.getCampaignsIdsByAgentIds(agent_ids).then(resultCamps => {
                        return resolve({...params, campaign_ids: resultCamps})
                    }).catch(err => {
                        reject(err);
                    })
                }
            })
            Promise.all([promiseParams]).then((newParams) => {
                let idx = 0;
                let resultArray = [];
                if (agent_ids && agent_ids.length === 0) {
                    return res.send({
                        success: false,
                        data: [],
                        status: 200
                    })
                }
                this.getReportByOneAgent({...newParams[0], agent_id: agent_ids}).then(result => {
                    if (result.success) {
                        agent_ids.forEach(agent => {
                            let currentAgent = dataAgents.filter((item) => item.user_id === agent)
                            let AgentStatusData = []
                            let total = 0
                            result.data.forEach(item => {
                                if (item.agent_id === agent) {
                                    total += Number(item.total)
                                    AgentStatusData.push(item)
                                }
                            })
                            AgentStatusData.push({label: 'total', code: 'total', total: total})
                            resultArray.push({agent: currentAgent[0], data: AgentStatusData});
                        })
                        return res.send({
                            success: true,
                            data: resultArray,
                            status: 200
                        })
                    } else {
                        return res.send({
                            success: true,
                            data: [],
                            status: 200
                        })
                    }

                }).catch(err => {
                    return this.sendResponseError(res, ['ErrorCannotGetStatus'], 1, 403)
                })

            }).catch(err => {
                return this.sendResponseError(res, ['ErrorCannotGetStatus'], 1, 403)
            })

        })
    }

    getUsers = (agents_ids, campaign_ids, roleCrmAgent, account_id) => {
        return new Promise((resolve, reject) => {
            let whereQuery = {
                active: 'Y',
                role_crm_id: roleCrmAgent,
                account_id: account_id
            }
            if (agents_ids && agents_ids.length !== 0) {
                whereQuery.user_id = agents_ids;
            }
            if (agents_ids && agents_ids.length === 0 && campaign_ids && campaign_ids.length !== 0) {
                whereQuery.campaign_id = campaign_ids
            }
            this.db['users'].findAll({
                where: whereQuery
            }).then((allAgents) => {
                let users_ids = allAgents.map(user => user.user_id);
                let users_uuids = allAgents.map(user => user.sip_device.uuid);
                resolve({
                    success: true,
                    dataAgents: allAgents,
                    users_ids: users_ids,
                    users_uuids: users_uuids
                })
            }).catch(err => resolve([]))
        })


    }

    removeDuplicates(arr) {
        let resultArray = [...new Set(arr)];
        return resultArray.filter(element => {
            return element !== null && element !== undefined;
        });
    }

    getCampaignsIdsByAgentIds(agentIDs) {
        return new Promise((resolve, reject) => {
            this.db['users'].findAll({
                where: {user_id: agentIDs}
            }).then((allAgents) => {
                let campaignIds = allAgents.map(user => user.campaign_id);
                resolve(this.removeDuplicates(campaignIds))
            }).catch(() => resolve([]))
        })
    }

    getReportByOneAgent(params) {
        return new Promise((resolve, reject) => {
            let {
                dataAgents,
                agent_id,
                call_status,
                campaign_ids,
                dateSelected_from,
                dateSelected_to,
                end_time,
                listCallFiles_ids,
                start_time,
                account_code
            } = params;

            let sqlCallsStats = `
                select distinct us.user_id as agent_id,callS.callstatus_id , callS.code, callS.label,
                       case
                           WHEN stats.total is null THEN 0
                           ELSE stats.total
                           END
                from users as us
                full join callstatuses as callS on 1=1
                         left join (
                    select callH.agent_id, callS.callstatus_id, callS.code, count(*) as total
                    from callstatuses as callS
                             left join calls_historys as callH On callH.call_status = callS.code
                             left join callfiles as callF On callF.callfile_id = callH.call_file_id
                             left join listcallfiles as listCallF On callF.listcallfile_id = listCallF.listcallfile_id
                    where 1 = 1
                        EXTRA_WHERE
                    group by callS.code, callS.callstatus_id, callH.agent_id)
                    as stats On stats.agent_id = us.user_id and stats.callstatus_id = callS.callstatus_id
                where callS.active = 'Y' EXTRA_WHERE_WITHOUT_CAMP EXTRA_WHERE_CAMP EXTRA_WHERE_STATUS
                order by total desc

            `

            let extra_where = '';
            let extra_where_camp = '';
            let extra_where_status = '';
            let extra_where_without_camp = '';
            if (start_time && start_time !== '') {
                extra_where += ' AND callH.started_at >= :start_time';
            }
            if (end_time && end_time !== '') {
                extra_where += ' AND  callH.finished_at <=  :end_time';
            }
            if (agent_id) {
                extra_where += ' AND callH.agent_id in (:agent_id)';
            }

            if (call_status && call_status !== '' && call_status.length !== 0) {
                extra_where += ' AND callS.callstatus_id in (:call_status)';
                extra_where_status += ' AND callS.callstatus_id in (:call_status)';
            }
            if (listCallFiles_ids !== '' && listCallFiles_ids.length !== 0) {
                extra_where += ' AND listCallF.listcallfile_id in(:listCallFiles_ids)';
            }
            if (campaign_ids !== '' && campaign_ids.length !== 0) {
                extra_where_camp += "AND  (callS.campaign_id in(:campaign_ids) or  callS.is_default = 'Y') and us.user_id in (:agent_id)"
                extra_where += " AND (callS.campaign_id in(:campaign_ids) OR  callS.is_default = 'Y') "
            } else {
                extra_where_without_camp += "AND (stats.total > 0 or callS.is_default = 'Y')"
            }
            sqlCallsStats = sqlCallsStats.replace('EXTRA_WHERE', extra_where);
            sqlCallsStats = sqlCallsStats.replace('EXTRA_WHERE_CAMP', extra_where_camp);
            sqlCallsStats = sqlCallsStats.replace('EXTRA_WHERE_STATUS', extra_where_status);
            sqlCallsStats = sqlCallsStats.replace('EXTRA_WHERE_WITHOUT_CAMP', extra_where_without_camp);
            db.sequelize['crm-app'].query(sqlCallsStats, {
                type: db.sequelize['crm-app'].QueryTypes.SELECT,
                replacements: {
                    start_time: dateSelected_from.concat(' ', start_time),
                    end_time: dateSelected_to.concat(' ', end_time),
                    agent_id: agent_id,
                    account_code: account_code,
                    listCallFiles_ids: listCallFiles_ids,
                    call_status: call_status,
                    campaign_ids: campaign_ids
                }
            }).then(data_stats => {
                let total = 0;
                data_stats.map(item => {
                    total += parseInt(item.total);
                })
                data_stats.push({
                    'label': 'total',
                    'code': 'total',
                    'total': total
                })
                resolve({
                    success: true,
                    data: data_stats,
                    status: 200
                })
            }).catch(err => {
                reject({
                    success: false,
                    data: [],
                    status: 403
                })
            })
        })
    }

    // --------- Agent Call Report ----------//
    formatUsers(users_ids) {
        return new Promise((resolve, reject) => {
            this.db['users'].findAll({where: {active: 'Y', user_id: users_ids}}).then(users => {
                if (!!!users) {
                    resolve({success: false})
                } else {
                    let newArrayUsers = [];
                    users.map(user => {
                        let NewFormat = {
                            user_id: user.user_id,
                            username: user.username,
                            first_name: user.first_name,
                            last_name: user.last_name,
                            profile_image_id: user.profile_image_id
                        }
                        newArrayUsers.push(NewFormat);
                    })
                    resolve({
                        success: true,
                        data: newArrayUsers
                    })
                }
            }).catch(err => reject(err))
        })

    }

    agentCallReports(req, res, next) {
        let _this = this;
        const params = req.body;
        let {
            agent_ids,
            listCallFiles_ids,
            dateSelected_to,
            dateSelected_from,
            start_time,
            end_time,
            campaign_ids
        } = params;
        let dataSelect_from = moment(dateSelected_from).format('YYYY-MM-DD').concat(' ', start_time)
        let dataSelect_to = moment(dateSelected_to).format('YYYY-MM-DD').concat(' ', end_time)
        this.DataCallsAgents(agent_ids, listCallFiles_ids, dataSelect_from, dataSelect_to, campaign_ids).then(data_call => {
            let FilterdUsers = [];
            data_call.map(user => FilterdUsers.push(user.agent_id));
            this.formatUsers(FilterdUsers).then((Users) => {
                let AllUsers = Users.data;
                AllUsers.map(item => {
                    let index_idUser = data_call.findIndex(item_call => item_call.agent_id === item.user_id);
                    if (index_idUser !== -1) {
                        item.Number_of_call = data_call[index_idUser].totalcalls;
                        item.Talking_Duration = data_call[index_idUser].durationcalls;
                        item.AVG_Talking_Duration = data_call[index_idUser].moy;

                    } else {
                        item.Number_of_call = '0';
                        item.Talking_Duration = '0';
                        item.AVG_Talking_Duration = '0';
                    }
                })
                res.send({
                    success: true,
                    data: AllUsers
                })
            })

        })


    }

    // ------------ Pause Status Report ------------//
    affectPauseStatusToSquelette(PS, Squelette) {
        return new Promise((resolve, reject) => {

            const isSameUser = (a, b) => a.pausestatus_id === b.pausestatus_id;
            const onlyInLeft = (left, right, compareFunction) =>
                left.filter(leftValue =>
                    !right.some(rightValue =>
                        compareFunction(leftValue, rightValue)));

            const onlyInPS = onlyInLeft(PS, Squelette, isSameUser);
            const onlyInSquelette = onlyInLeft(Squelette, PS, isSameUser);

            const result = [...PS, ...onlyInPS, ...onlyInSquelette];
            resolve(result)
        })
    }

    squeletteQuery(pauseStatusIds) {
        return new Promise((resolve, reject) => {
            let sqlPauseStatus = `
                select 0    as total,
                       null as user_id,
                       PS.label,
                       null as username,
                       PS."isSystem",
                       PS.code,
                       PS.pausestatus_id
                from pausestatuses as PS
                where PS.active = 'Y'
                  and PS.status = 'Y'
                  AND PS.pausestatus_id in (:PS)`
            db.sequelize['crm-app'].query(sqlPauseStatus, {
                type: db.sequelize['crm-app'].QueryTypes.SELECT,
                replacements: {
                    PS: pauseStatusIds
                }
            }).then(Res_pauseStatus => {
                resolve(Res_pauseStatus)
            }).catch(err => {
                reject(err)
            })
        })
    }

    countUsers(params) {
        return new Promise((resolve, reject) => {
            let {
                agent_ids,
                dateSelected_from,
                dateSelected_to,
                start_time,
                end_time,
                pauseStatus
            } = params;
            let sqlCount = `
                select distinct case
                                    WHEN count(ALE.pause_status_id) is null THEN 0
                                    ELSE count(ALE.pause_status_id)
                                    END                                as total,
                                ALE.user_id,
                                U.first_name,
                                U.last_name,
                                U.profile_image_id,
                                CONCAT(U.first_name, ' ', U.last_name) as username,
                                sum(ALE.finish_at - ALE.start_at)
                from public.agent_log_events as ALE
                         left join pausestatuses as PS
                                   on ALE.pause_status_id = PS.pausestatus_id
                         left join users as U
                                   on ALE.user_id = U.user_id
                where ALE.action_name = 'on-break'
                  and PS.active = 'Y'
                  and PS.status = 'Y'
                  and ALE.active = 'Y'
                    WHERECOND
                group by ALE.user_id, CONCAT(U.first_name, ' ', U.last_name), U.first_name, U.last_name, U.profile_image_id
            `
            let extraWhere = '';
            if (agent_ids && agent_ids.length !== 0) {
                extraWhere += 'AND ALE.user_id in (:agent_ids) ';
            }
            if (pauseStatus && pauseStatus.length !== 0) {
                extraWhere += 'AND ALE.pause_status_id in (:pauseStatus) ';
            }
            if (start_time && start_time !== '') {
                extraWhere += ' AND ALE.start_at >= :start_time';
            }
            if (end_time && end_time !== '') {
                extraWhere += ' AND  ALE.finish_at <=  :end_time';
            }
            sqlCount = sqlCount.replace('WHERECOND', extraWhere);
            db.sequelize['crm-app'].query(sqlCount, {
                type: db.sequelize['crm-app'].QueryTypes.SELECT,
                replacements: {
                    start_time: dateSelected_from.concat(' ', start_time),
                    end_time: dateSelected_to.concat(' ', end_time),
                    agent_ids: agent_ids,
                    pauseStatus: pauseStatus,
                }
            }).then(data_stats => {
                let dataS = [];
                if (data_stats && data_stats.length !== 0) {

                    data_stats.map(item => dataS.push({
                        user_id: item.user_id,
                        username: item.username,
                        profile_id: item.profile_image_id,
                        first_name: item.first_name,
                        last_name: item.last_name
                    }))
                }
                resolve(dataS)
            }).catch(err => {
                reject(err)
            })
        })
    }

    pauseStatusReports(req, res, next) {
        let idx = 0;
        const params = req.body;
        let {
            agent_ids,
            dateSelected_from,
            dateSelected_to,
            start_time,
            end_time,
            pauseStatus
        } = params;
        this.db['users'].findAll({where: {user_id: agent_ids, active: 'Y'}}).then(UsersFetch => {
            let AllU = [];
            if (UsersFetch && UsersFetch.length !== 0) {
                UsersFetch.forEach(U => {
                    AllU.push({
                        user_id: U.user_id,
                        username: U.first_name + ' ' + U.last_name,
                        profile_id: U.profile_image_id,
                        first_name: U.first_name,
                        last_name: U.last_name
                    })
                })
            }
            this.countUsers(params).then(resUsers => {
                if (agent_ids && agent_ids.length === 0) {
                    AllU = resUsers;
                }
                this.squeletteQuery(pauseStatus).then(SqueletteQuery => {
                    let sqlPauseStatus = `
                        select count(ALE.pause_status_id)             as total,
                               PS.label,
                               ALE.user_id,
                               PS.pausestatus_id,
                               PS.code,
                               PS."isSystem",
                               CONCAT(U.first_name, ' ', U.last_name) AS username,
                               sum(ALE.finish_at - ALE.start_at) as time
                        from public.agent_log_events as ALE
                            left join pausestatuses as PS
                        on ALE.pause_status_id = PS.pausestatus_id
                            left join users as U
                            on ALE.user_id = U.user_id
                        where ALE.action_name = 'on-break'
                          and PS.active = 'Y'
                          and PS.status = 'Y'
                          and ALE.active = 'Y'
                            WHERECONDITION
                        group by PS.label, ALE.user_id, PS.pausestatus_id, PS.code, CONCAT(U.first_name, ' ', U.last_name), PS."isSystem"
                    `
                    let extraWhere = '';
                    if (agent_ids && agent_ids.length !== 0) {
                        extraWhere += 'AND ALE.user_id in (:agent_ids) ';
                    }
                    if (pauseStatus && pauseStatus.length !== 0) {
                        extraWhere += 'AND ALE.pause_status_id in (:pauseStatus) ';
                    }
                    if (start_time && start_time !== '') {
                        extraWhere += ' AND ALE.start_at >= :start_time';
                    }
                    if (end_time && end_time !== '') {
                        extraWhere += ' AND  ALE.finish_at <=  :end_time';
                    }
                    sqlPauseStatus = sqlPauseStatus.replace('WHERECONDITION', extraWhere);
                    db.sequelize['crm-app'].query(sqlPauseStatus, {
                        type: db.sequelize['crm-app'].QueryTypes.SELECT,
                        replacements: {
                            start_time: dateSelected_from.concat(' ', start_time),
                            end_time: dateSelected_to.concat(' ', end_time),
                            agent_ids: agent_ids,
                            pauseStatus: pauseStatus,
                        }
                    }).then(data_stats => {
                        if (!!!data_stats || data_stats.length === 0) {
                            return res.send({
                                success: false,
                                data: [],
                                status: 403
                            })
                        }
                        let dataArray = [];
                        AllU.forEach((user, index) => {
                            let SQ_Demo = SqueletteQuery[0];
                            SQ_Demo = {
                                ...SQ_Demo,
                                user_id: user.user_id,
                                username: user.username,
                            }
                            let filtered = data_stats.length !== 0 ? (data_stats.filter(u => u.user_id === user.user_id).length !== 0 ? data_stats.filter(u => u.user_id === user.user_id) : [SQ_Demo]) : [SQ_Demo];
                            let UserID = null;
                            let UserName = null;
                            UserID = filtered[0].user_id;
                            UserName = filtered[0].username;
                            const updatedFiltered = filtered.map(F => {
                                    return {...F, total: parseInt(F.total)}
                                }
                            );
                            const updatedOSArray = SqueletteQuery.map(p => {
                                    return {...p, user_id: UserID, username: UserName}
                                }
                            );
                            this.affectPauseStatusToSquelette(updatedFiltered, updatedOSArray).then(SQ => {
                                SQ.forEach(function (v) {
                                    delete v.username;
                                    delete v.user_id
                                })
                                dataArray.push({
                                    agent: user,
                                    data: SQ
                                })
                                if (idx < AllU.length - 1) {
                                    idx++
                                } else {
                                    return res.send({
                                        success: true,
                                        data: dataArray,
                                        status: 200
                                    })
                                }
                            }).catch(err => {
                                return this.sendResponseError(res, ['Error.cannotAffectPauseStatus', err], 1, 403)
                            });

                        })
                        // }

                    }).catch(err => {
                        return this.sendResponseError(res, ['Error.cannotGetStatus', err], 1, 403)
                    })
                }).catch(err => {
                    return this.sendResponseError(res, ['Error.cannotGetStatus', err], 1, 403)
                })
            })
        })


        //   }
    }

    // ------------ VMD Reports ----------//

    addObjectWithSum(objects, campaigns) {
        return new Promise((resolve, reject) => {
            let sumObject = {campaign: ''};
            let idx_Array = 0;
            objects.forEach((currentObject, index) => {
                objects[index].campaign = campaigns && campaigns[objects[index].campaign] ? campaigns[objects[index].campaign] : objects[index].campaign
                let idx = 0;
                Object.entries(currentObject).forEach(([key, value]) => {
                    if (key !== 'campaign' && typeof value === 'number') {
                        sumObject[key] = (sumObject[key] || 0) + value;
                    }
                    if (idx < Object.keys(currentObject).length - 1) {
                        idx++
                    } else {
                        if (idx_Array < objects.length - 1) {
                            idx_Array++
                        } else {
                            objects.push(sumObject);
                            return resolve(objects);
                        }
                    }

                });
            });
        });
    }

    vmdReports(req, res, next) {
        const params = req.body;
        let {
            campaign_ids,
            callFile_ids,
            selectedVmdStatus,
            dateSelected_from,
            dateSelected_to,
            start_time,
            end_time,
            account_code
        } = params;
        let COUNT_VMDS = ""
        let extra_where = ""
        if (selectedVmdStatus.includes('HUMAN')) {
            COUNT_VMDS += `, CAST(COUNT (CASE WHEN "vmdStatus" = 'HUMAN' THEN 1 END ) AS INT) as HUMAN `
        }
        if (selectedVmdStatus.includes('NOTSURE')) {
            COUNT_VMDS += `, CAST(COUNT (CASE WHEN "vmdStatus" = 'NOTSURE' THEN 1 END ) AS INT) as NOTSURE `
        }
        if (selectedVmdStatus.includes('MACHINE')) {
            COUNT_VMDS += `, CAST(COUNT (CASE WHEN "vmdStatus" = 'MACHINE' THEN 1 END ) AS INT) as MACHINE `
        }
        if (start_time && start_time !== '') {
            extra_where += ' AND start_time >= :start_time';
        }
        if (end_time && end_time !== '') {
            extra_where += ' AND end_time <=  :end_time';
        }
        if (campaign_ids && campaign_ids.length !== 0) {
            campaign_ids = campaign_ids.map(num => num.toString());
            extra_where += ' AND "campaignId" in (:campaign_ids)';
        }
        let sqlCampaignVMD = `select CAST("campaignId" AS INT) as campaign
                            EXTRA_COUNT_VMDS
                            , CAST(count("vmdStatus") AS INT) as total
from acc_cdrs WHERE SUBSTRING("custom_vars", 0 , POSITION(':' in "custom_vars") ) = :account_code
AND "vmdStatus" in (:VMD_STATUS) AND "campaignId" notnull EXTRA_WHERE group by "campaignId" 
                `
        sqlCampaignVMD = sqlCampaignVMD.replace('EXTRA_COUNT_VMDS', COUNT_VMDS)
        sqlCampaignVMD = sqlCampaignVMD.replace('EXTRA_WHERE', extra_where)
        db.sequelize["cdr-db"]
            .query(sqlCampaignVMD, {
                type: db.sequelize["cdr-db"].QueryTypes.SELECT,
                replacements: {
                    start_time: moment(dateSelected_from).format('YYYY-MM-DD').concat(' ', start_time),
                    end_time: moment(dateSelected_to).format('YYYY-MM-DD').concat(' ', end_time),
                    account_code: account_code,
                    VMD_STATUS: selectedVmdStatus,
                    campaign_ids: campaign_ids
                }
            }).then(resData => {
            if (resData && resData.length !== 0) {
                let campaign_ids = resData.map(c => c.campaign)
                this.db['campaigns'].findAll({where: {campaign_id: campaign_ids}}).then(campaigns => {
                    let C = {}
                    campaigns.forEach(camp => {
                        C[camp.campaign_id] = camp.campaign_name
                    })
                    this.addObjectWithSum(resData, C).then(res_vmd => {
                        return res.send({success: true, data: res_vmd})
                    })
                }).catch(err => {
                    return this.sendResponseError(res, ['cannotFindCampaigns', err], 0, 403)
                })
            } else {
                return res.send({success: false, data: []})
            }
        }).catch(err => {
            return this.sendResponseError(res, ['cannotgetDataVMD', err], 1, 403)
        })

    }


    // ------------ EXTRA --------------//
    generatePassword() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const digits = '0123456789';
        let password = '';

        // Generate 3 random characters
        for (let i = 0; i < 3; i++) {
            password += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        // Generate 3 random digits
        for (let i = 0; i < 3; i++) {
            password += digits.charAt(Math.floor(Math.random() * digits.length));
        }

        return password;
    }


    OnConnectTelco(uuid, telcoStatus) {
        return new Promise((resolve, reject) => {
            if (!!!telcoStatus) {
                return resolve({
                    success: true
                })
            } else {
                axios
                    .get(`${base_url_cc_kam}api/v1/agents/${uuid}`, call_center_authorization)
                    .then(resp => {
                        let agent = {"status": telcoStatus};
                        axios
                            .put(`${base_url_cc_kam}api/v1/agents/${uuid}/status`, agent, call_center_authorization)
                            .then(() => {
                                resolve({
                                    success: true
                                })
                            }).catch(() => {
                            resolve({
                                success: false
                            })
                        })
                    }).catch(() => {
                    resolve({
                        success: false
                    })
                })
            }

        })
    }

    qualifyCallFile(callfile, callfile_id, user_id, req) {
        return new Promise((resolve, reject) => {
            if (!!!callfile || !!!callfile_id) {
                return resolve(true)
            }
            let Body = callfile;
            Body.note = null
            Body.callfile_id = callfile_id
            Body.updated_at = new Date()
            let DDC = {
                agent_id: user_id,
                note: '',
                call_file_id: callfile_id
            }
            _callfilebo._updateCallFileQualification(callfile_id, Body, req).then(result => {
                DDC.revision_id = result.revision_id
                _callhistorybo._updateCall(DDC).then(resultHistory => {
                    resolve(resultHistory)
                }).catch(err => reject(err))
            }).catch(err => reject(err))
        })
    }

    changeCrmStatus(req, res, next) {
        let {user_id, uuid, callfile, callfile_id, currentToken} = req.body;
        _agent_log_eventsbo._getLastEvent(user_id).then(event => {
            let status = event.data.dataValues.action_name
            if (status === 'waiting-call' || status === 'in_call' || (status === 'logged-out' && currentToken !== null)) {
                this.onConnectFunc(user_id, uuid, 'connected', 'logged-out')
                    .then((user) => {
                        if (user.success) {
                            let {sip_device, first_name, last_name, user_id, campaign_id, account_id} = user.agent.user;
                            let data_agent = {
                                user_id: user_id,
                                first_name: first_name,
                                last_name: last_name,
                                uuid: sip_device.uuid,
                                crmStatus: user.agent.user.params.status,
                                telcoStatus: sip_device.status,
                                timerStart: sip_device.updated_at,
                                campaign_id: campaign_id,
                                account_id: account_id,
                                call_type: null
                            };
                            appSocket.emit('agent_connection', data_agent);
                            this.qualifyCallFile(callfile, callfile_id, user_id, req).then(resultQualify => {
                                return res.sendStatus(resultQualify ? 204 : 403);
                            }).catch(() => {
                                return res.sendStatus(403)
                            })
                        } else {
                            if (user.status === 403) {
                                return res.sendStatus(403)
                            }
                            return res.sendStatus(200)
                        }

                    }).catch(() => {
                    return res.sendStatus(403)
                })
            } else {
                res.sendStatus(204)
            }
        }).catch(() => {
            return res.sendStatus(403)
        })


    }

    callInQueue(req, res, next) {
        let {account_id, campaign_id} = req.body;
        if (!!!campaign_id && !!!account_id) {
            return this.sendResponseError(res, ['Error.campaign_id ou account_id '], 1, 403)
        }
        if (campaign_id) {
            this.db['campaigns'].findOne({
                where: {
                    campaign_id: campaign_id,
                    active: 'Y',
                    status: 'Y'
                }
            }).then(result => {
                if (result) {
                    res.send({
                        success: true,
                        total: result.queue_count
                    })
                } else {
                    res.send({
                        success: true,
                        total: 0
                    })
                }
            }).catch(err => {
                return this.sendResponseError(res, ['Error.cannotCamp', err], 1, 403)
            })
        } else {
            let sql = `select sum(queue_count) from campaigns
                                 where account_id = :account_id and active = 'Y' and status = 'Y'`

            db.sequelize['crm-app'].query(sql, {
                type: db.sequelize['crm-app'].QueryTypes.SELECT,
                replacements: {
                    account_id: account_id
                }
            }).then(result => {
                if (result) {
                    res.send({
                        success: true,
                        total: result[0].sum
                    })
                } else {
                    res.send({
                        success: true,
                        total: 0
                    })
                }

            }).catch(err => {
                return this.sendResponseError(res, ['Error.cannotSumQueue', err], 1, 403)
            })
        }

    }

    getUserBySIP_Username(req,res,next){
        let {username,account_id} = req.body
        if(!!!username && !!!account_id){
            return this.sendResponseError(res,['EmptyBody'],0,403)
        }
        let query = `select * from users where sip_device->>'username' = :username and active = :active and account_id = :account_id and status = :active limit :limit`
        db.sequelize["crm-app"]
            .query(query, {
                type: db.sequelize["crm-app"].QueryTypes.SELECT,
                replacements: {
                    username: username,
                    active: 'Y',
                    account_id: account_id,
                    limit : 1
                }
            }).then(user => {
                if(user && user.length !== 0){
                    res.send({
                        success : true,
                        data : user[0]
                    })
                }else{
                    res.send({
                        success : false,
                        data : null
                    })
                }
        }).catch(err => {
            return this.sendResponseError(res,['cannotGetUser',err],1,403)
        })
    }

}

module.exports = agents;
