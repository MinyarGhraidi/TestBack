const {baseModelbo} = require('./basebo');
let db = require('../models');
const {validateEmail} = require("../helpers/helpers");
const config = require('../config/config.json');
const jwt = require('jsonwebtoken');
const {default: axios} = require("axios");
let moment = require("moment");
const tz = require(__dirname + '/../config/config.json')["tz"];
const call_center_token = require(__dirname + '/../config/config.json')["call_center_token"];
const base_url_cc_kam = require(__dirname + '/../config/config.json')["base_url_cc_kam"];
const call_center_authorization = {
    headers: {Authorization: call_center_token}
};
const PromiseBB = require("bluebird");

const usersbo = require('./usersbo');
let _usersbo = new usersbo;
const appSocket = new (require('../providers/AppSocket'))();
const appHelper = require("../helpers/app");
const Op = require("sequelize/lib/operators");
const app_config = appHelper.appConfig;

class agents extends baseModelbo {
    constructor() {
        super('agents', 'user_id');
        this.baseModal = 'agents';
        this.primaryKey = 'user_id'
    }

    //------------------ > AUTH <----------------
    signUp(req, res, next) {
        const formData = req.body;

        if (!formData.email || !formData.password) {

            return this.sendResponseError(res, ['Error.EmptyFormData'], 0, 403);
        }

        if (!validateEmail(formData.email)) {

            return this.sendResponseError(res, ['Error.InvalidEmail'], 0, 403);
        }

        if (
            !!!formData.first_name
            || !!!formData.last_name
            || !!!formData.email
            || !!!formData.username
        ) {
            return this.sendResponseError(res, ['Error.PleaseFillAllRequiredFields'], 0, 403);
        }

        if (
            String(formData.password).length < 6
        ) {
            return this.sendResponseError(res, ['Error.PleaseEnterAStrongPassword'], 0, 403);
        }

        const {Op} = db.sequelize;
        this.db['users'].findOne({
            where: {
                active: 'Y',
                [Op.or]: {
                    username: formData.username,
                    email: formData.email,
                }
            }
        }).then(user_item => {
            if (user_item) {
                return this.sendResponseError(res, ['Error.UserAlreadyExists'], 0, 403);
            }

            const user = db.users.build();
            user.setPassword_hash(formData.password);
            user.email = formData.email;
            user.first_name = formData.first_name;
            user.last_name = formData.last_name;
            user.username = formData.username;
            user.save().then(userSaved => {
                res.send({
                    success: true,
                    user: userSaved,
                    message: 'Account user created with success!'
                });
            }).catch((error) => {
                return this.sendResponseError(res, ['Error.AnErrorHasOccurredSaveUser'], 1, 403);
            });
        }).catch((error) => {
            return this.sendResponseError(res, ['Error.AnErrorHasOccurredUser'], 1, 403);
        });
    }

    signIn(req, res, next) {

        if ((!req.body.email || !req.body.password)) {
            return this.sendResponseError(res, ['Error.RequestDataInvalid'], 0, 403);
        } else {
            const {email, password} = req.body;
            if (email && password) {
                this.db['users'].findOne({
                    include: [{
                        model: db.roles,
                        as: 'role',
                    },
                        {
                            model: db.accounts,
                            as: 'account',
                        }],
                    where: {
                        email: email,
                        active: 'Y'
                    }
                }).then((user) => {
                    if (!user) {
                        res.send({
                            message: 'Success',

                        });
                    } else {
                        if (user.password_hash && user.verifyPassword(password)) {
                            const token = jwt.sign({
                                user_id: user.user_id,
                                username: user.username,
                                email: user.email,
                            }, config.secret, {
                                expiresIn: '8600m'
                            });
                            res.send({
                                message: 'Success',
                                user: user.toJSON(),
                                success: true,
                                token: token,
                                result: 1,
                            });

                        } else {
                            this.sendResponseError(res, ['Error.InvalidPassword'], 2, 403);
                        }
                    }
                }).catch((error) => {
                    return this.sendResponseError(res, ['Error.AnErrorHasOccurredUser'], 1, 403);
                });
            }
        }
    }


    //----------------> Add Agent <------------------
    saveAgent(req, res, next) {
        let _this = this;
        let idx = 0;
        let {values, accountcode, bulkNum} = req.body;
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
            this.bulkAgents(bulkNum, values.account_id, values.username).then((resultArray) => {
                let addAgent = new Promise((resolve, reject) => {
                    resultArray.forEach((user) => {
                        let isBulk = bulkNum.length > 1
                        this.saveOneAgent(values, user, isBulk)
                            .then(() => {
                                if (idx < resultArray.length - 1) {
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
                    return this.sendResponseError(res, ['Error.CannotAddAgents'], 0, 403);
                })
            }).catch((err) => {
                return this.sendResponseError(res, ['Error.CannotAddAgents'], 0, 403);
            })
        }
    }

    bulkAgents(bulkNum, account_id, username) {
        return new Promise((resolve, reject) => {
            let idx = 0;
            let arrayUsers = [];
            if (bulkNum.length === 1) {
                _usersbo.isUniqueUsername(username, 0).then(isUnique => {
                    if (!isUnique) {
                        _usersbo.generateUniqueUsernameFunction().then(dataAgent => {
                            resolve([{username: dataAgent.username}]);
                        })
                    } else {
                        resolve([{username: username}]);
                    }
                }).catch((err) => {
                    reject(err);
                })
            } else {
                bulkNum.forEach(() => {
                    _usersbo.generateUniqueUsernameFunction().then(dataAgent => {
                        let objAgent = {
                            username: dataAgent.username,
                            first_name: dataAgent.first_name,
                        }
                        arrayUsers.push(objAgent);
                        if (idx < bulkNum.length - 1) {
                            idx++
                        } else {
                            resolve(arrayUsers)
                        }
                    }).catch((err) => {
                        reject(err);
                    })
                })
            }

        })
    }

    saveOneAgent(user, AddedFields, isBulk) {
        return new Promise((resolve, reject) => {
            user.username = AddedFields.username;
            let {password, domain, status, options} = user.sip_device;
            let name_agent = isBulk ? AddedFields.first_name : user.first_name + " " + user.last_name;
            _usersbo.isUniqueUsername(AddedFields.username, 0)
                .then(isUnique => {
                    if (isUnique) {
                        let data_subscriber = {
                            username: AddedFields.username,
                            domain_uuid: user.domain.params.uuid,
                            password,
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
                                        this.saveAgentInDB(user, AddedFields, isBulk, uuidAgent)
                                            .then(() => {
                                                resolve(true)
                                            })
                                            .catch(err => {
                                                reject(err)
                                            })
                                    }).catch((err) => {
                                    reject(err)
                                })
                            }).catch((err) => {
                            reject(err)
                        })
                    } else {
                        reject(true);
                    }
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    saveAgentInDB(values, AddedFields, isBulk, uuidAgent) {
        return new Promise((resolve, reject) => {
            _usersbo
                .saveUserFunction(values, AddedFields, isBulk, uuidAgent)
                .then(agent => {
                    let user_id = agent.user_id;
                    let agentLog = {user_id: user_id};
                    let modalObj = this.db['agent_log_events'].build(agentLog)
                    modalObj
                        .save()
                        .then(agent => {
                            resolve(agent)
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

    //---------------> Update Agent <----------------------
    updateAgent(req, res, next) {
        let _this = this;
        let values = req.body.values;
        let accountcode = req.body.accountcode;
        let {sip_device} = values;
        let {password, options, status, enabled, subscriber_id} = sip_device;
        let user_id = req.body.values.user_id;
        _usersbo.isUniqueUsername(values.username, user_id)
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
                                                    updated_at: new Date()
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
                                                            .saveUserFunction(update_user, [], false)
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
                                                    return _this.sendResponseError(res, ['Error.CannotUpdateAgent'], 1, 403);
                                                })
                                            }).catch((err) => {
                                            return _this.sendResponseError(res, ['Error.CannotUpdateSubscriber'], 1, 403);
                                        })
                                    }).catch((err) => {
                                    return _this.sendResponseError(res, ['Error.CannotGetSubscriber'], 1, 403);
                                })
                            }).catch((err) => {
                            return _this.sendResponseError(res, ['Error.CannotGetAgent'], 1, 403);
                        })
                    }).catch((err) => {
                        return _this.sendResponseError(res, ['Error.CannotFindUser'], 1, 403);
                    })
                } else {
                    res.send({
                        status: 403,
                        success: false,
                        error_type: 'check_username',
                        message: 'This username is already exist'
                    });
                }
            }).catch((err) => {
            return _this.sendResponseError(res, ['Error.UsernameNotUnique'], 1, 403);
        })

    }

    //----------------> Delete Agent <-------------------------
    deleteAgent(req, res, next) {
        let _this = this;
        let agent_id = req.body.user_id;
        this.deleteAgentWithSub(agent_id)
            .then(result => {
                res.send({
                    succes: 200,
                    message: "Agent has been deleted with success"
                })
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
            });
    }

    deleteAgentWithSub(user_id) {
        return new Promise((resolve, reject) => {
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
                                }).catch(err => reject(err))
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

    //-----------------> Telco Agent <------------------------

    onConnect(req, res, next) {
        let _this = this;
        let {user_id, uuid, crmStatus, telcoStatus} = req.body;
        this.onConnectFunc(user_id, uuid, crmStatus, telcoStatus)
            .then((user) => {
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
                    account_id: account_id
                };
                appSocket.emit('agent_connection', data_agent);
                res.send({
                    status: 200,
                    message: 'success'
                })
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
            });
    }

    onConnectFunc(user_id, uuid, crmStatus, telcoStatus) {
        return new Promise((resolve, reject) => {
            if (crmStatus === "in_call" || crmStatus === "in_qualification") {
                this.db["users"].findOne({where: {user_id: user_id}})
                    .then(user => {
                        if (user) {
                            let params = user.params;
                            user.updated_at = moment(new Date());
                            this.updateAgentStatus(user_id, user, telcoStatus, crmStatus, params)
                                .then((agent) => {
                                    if (agent.success) {
                                        resolve({
                                            success: true,
                                            agent: agent
                                        });
                                    } else {
                                        resolve({
                                            success: false,
                                        });
                                    }
                                })
                                .catch((err) => {
                                    reject(err);
                                });
                        } else {
                            resolve({
                                success: false
                            })
                        }

                    })
                    .catch((err) => {
                        reject(err);
                    });
            } else {
                if (uuid) {
                    axios
                        .get(`${base_url_cc_kam}api/v1/agents/${uuid}`, call_center_authorization)
                        .then(resp => {
                            let agent = {"status": telcoStatus};
                            axios
                                .put(`${base_url_cc_kam}api/v1/agents/${uuid}/status`, agent, call_center_authorization)
                                .then(() => {
                                    this.db["users"].findOne({where: {user_id: user_id}})
                                        .then(user => {
                                            if (user) {
                                                let params = user.params;
                                                user.updated_at = moment(new Date());
                                                this.updateAgentStatus(user_id, user, telcoStatus, crmStatus, params)
                                                    .then(agent => {
                                                        if (agent.success) {
                                                            resolve({
                                                                success: true,
                                                                agent: agent
                                                            });
                                                        } else {
                                                            resolve({
                                                                success: false,
                                                            });
                                                        }
                                                    })
                                                    .catch((err) => {
                                                        reject(err);
                                                    });
                                            } else {
                                                resolve({
                                                    success: false
                                                })
                                            }

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
                } else {
                    reject(false)
                }

            }

        })
    }

    updateAgentStatus(user_id, agent_, telcoStatus, crmStatus, params) {
        let updatedAt_tz = moment(new Date());
        return new Promise((resolve, reject) => {
            let agent;
            let sip_device = agent_.sip_device;
            sip_device.status = telcoStatus;
            sip_device.updated_at = updatedAt_tz;
            agent = {user_id: user_id, sip_device: sip_device, params: params};
            agent.params.status = crmStatus;
            this.db['users'].update(agent, {
                where: {user_id: user_id},
                returning: true,
                plain: true
            })
                .then(data_user => {
                    if (data_user) {
                        this.db['agent_log_events'].findOne({
                            where: {
                                user_id: user_id,
                                start_at: {
                                    $ne: null
                                }
                            },
                            order: [['start_at', 'DESC']],
                            limit: 1,
                        }).then(result => {
                            if (result) {
                                this.db['agent_log_events'].update({
                                        finish_at: new Date(),
                                        updated_at: updatedAt_tz
                                    },
                                    {
                                        where: {
                                            agent_log_event_id: result.agent_log_event_id,
                                            start_at: {
                                                $ne: null
                                            }
                                        },
                                        returning: true,
                                        plain: true
                                    }
                                ).then(last_action => {
                                    if (last_action) {
                                        this.db['agent_log_events'].build({
                                            user_id: user_id,
                                            action_name: agent.params.status,
                                            created_at: new Date(),
                                            updated_at: updatedAt_tz,
                                            start_at: last_action[1].finish_at
                                        }).save().then(agent_event => {
                                            resolve({
                                                success: true,
                                                data: agent_event,
                                                user: data_user[1]
                                            })

                                        }).catch(err => {
                                            reject(err)
                                        })
                                    } else {
                                        resolve({
                                            success: false
                                        })
                                    }

                                }).catch(err => {
                                    reject(err)
                                })
                            } else {
                                this.db['agent_log_events'].build({
                                    user_id: user_id,
                                    action_name: agent.params.status,
                                    created_at: new Date(),
                                    updated_at: updatedAt_tz,
                                    start_at: new Date()
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
                    _usersbo.verifyTokenParam(user.current_session_token).then((res) => {
                        if (res === true) {
                            let {sip_device, first_name, last_name, user_id, campaign_id} = user;
                            if(user.params.status === 'logged-out'){
                                this.db['users'].update({current_session_token: null}, {where: {user_id: user.user_id}}).then(() => {
                                    idx++;
                                }).catch(err => {
                                    reject(err)
                                })
                            }else{
                                this.db['agent_log_events'].findAll({
                                    where: {active: 'Y', user_id: user_id},
                                    order: [['agent_log_event_id', 'DESC']]
                                })
                                    .then(events => {
                                        Users.push({
                                            user_id: user_id,
                                            first_name: first_name,
                                            last_name: last_name,
                                            uuid: sip_device.uuid,
                                            crmStatus: user.params.status,
                                            telcoStatus: sip_device.status,
                                            timerStart: events[0].start_at,
                                            campaign_id: campaign_id
                                        });
                                        if (idx < agents.length - 1) {
                                            idx++;
                                        } else {
                                            resolve(Users);
                                        }
                                    })
                                    .catch(err => {
                                        reject(err)
                                    })
                            }

                        } else {
                            this.db['users'].update({current_session_token: null}, {where: {user_id: user.user_id}}).then(() => {
                                idx++;
                            }).catch(err => {
                                reject(err)
                            })
                        }

                    }).catch(err => reject(err))
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
            where.params = {"status": status}
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

            }).catch(err => {
            return _this.sendResponseError(res, ['Error.cannot fetch list agents', err], 1, 403);
        })
    }

    getCampaigns_ids() {
        return new Promise((resolve, reject) => {
            this.db['campaigns'].findAll({
                where: {
                    active: 'Y',
                }
            })
                .then(campaigns => {
                    let campaigns_ids = campaigns.map(el => el.campaign_id);
                    resolve(campaigns_ids);
                })
                .catch(err => {
                    reject(err);
                })
        })
    }

    onDisconnect(item) {
        return new Promise((resolve, reject) => {
            this.onConnectFunc(item.user_id, item.uuid, 'connected', 'logged-out')
                .then((user) => {
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
                    resolve(true)
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
            let couldDisc = data_agent.filter((agent) => agent.crmStatus !== 'waiting-call' && agent.crmStatus !== 'in_call') || [];
            let cannotDisc = data_agent.filter((agent) => agent.crmStatus === 'waiting-call' || agent.crmStatus === 'in_call') || [];
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

    //---------------> Report <---------------------
    agentDetailsReports(req, res, next) {
        const filter = req.body || null;
        let {dateSelected_from, dateSelected_to, campaign_id, agents, listcallfile_id, end_time, start_time} = filter
        this.filterData(campaign_id, agents, listcallfile_id).then(data => {
            if (data.success) {
                let dataSelect_from = moment(dateSelected_from).format('YYYY-MM-DD').concat(' ', start_time)
                let dataSelect_to = moment(dateSelected_to).format('YYYY-MM-DD').concat(' ', end_time)
                this.DataCallsAgents(data.agents, data.list, dataSelect_from, dataSelect_to).then(data_call => {
                    this.DataActionAgents(data.agents, dataSelect_from, dataSelect_to).then(data_actions => {
                        data.agents.map(item => {
                            let index_uuid = data_call.findIndex(item_call => item_call.agent === item.sip_device.uuid);
                            if (index_uuid !== -1) {
                                item.Number_of_call = data_call[index_uuid].count;
                                item.Talking_Duration = data_call[index_uuid].total;
                                item.AVG_Talking_Duration = data_call[index_uuid].moy;
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
                                        duration: item_action.sum
                                    })
                                }
                                item.data_action = action
                            })
                        })
                        res.send({
                            success: true,
                            data: data.agents
                        })
                    }).catch(err => {
                        return this.sendResponseError(res, ['Error.cannot fetch list agents1', err], 1, 403);
                    })

                }).catch(err => {
                    return this.sendResponseError(res, ['Error.cannot fetch list agents2', err], 1, 403);
                })
            }

        }).catch(err => {
            return this.sendResponseError(res, ['Error.cannot fetch list agents3', err], 1, 403);
        })

    }

    ListCallFile(campaign_id, listcallfile_id) {
        return new Promise((resolve, reject) => {
            let where = {};
            if (listcallfile_id) {
                where = {
                    listcallfile_id: listcallfile_id,
                    active: 'Y'
                }
            } else {
                where = {
                    active: 'Y'
                }
            }
            db['listcallfiles'].findAll({
                include: {
                    model: db.campaigns,
                    where: {
                        campaign_id: campaign_id,
                        active: 'Y'
                    },
                },
                where: where
            }).then(list => {
                resolve(list)
            }).catch(err => {
                reject(err)
            })
        })
    }

    DataCallsAgents(agents, list_Call, start_time, end_time) {
        return new Promise((resolve, reject) => {
            let uuid = agents.map(item =>
                item.sip_device.uuid
            )

            let Calls = list_Call.map(item =>
                item.callfile_id
            )
            let sqlCount = `select ac.agent,
                                       count(*),
                                       SUM(CAST(ac.durationsec AS INTEGER)) / 60 as total,
                                       SUM(CAST(ac.durationsec AS INTEGER) + CAST(ac.durationmsec AS INTEGER) / 1000) /
                                       60 / count(*)                             as moy
                                from acc_cdrs as ac
                                    EXTRA_WHERE
                                GROUP BY ac.agent`

            let extra_where_count = '';
            if (uuid && uuid.length !== 0) {
                extra_where_count += 'AND agent in (:uuid) '
            }
            if (start_time && start_time !== '') {
                extra_where_count += 'AND start_time >= :start_time ';
            }
            if (end_time && end_time !== '') {
                extra_where_count += 'AND end_time <=  :end_time ';
            }
            if (Calls && Calls.length !== 0) {
                extra_where_count += 'AND CAST((string_to_array("custom_vars", \':\'))[3] AS INTEGER) in (:calls) ';
            }
            if(extra_where_count !== ''){
                extra_where_count = extra_where_count.replace('AND','WHERE');
            }
            sqlCount = sqlCount.replace('EXTRA_WHERE', extra_where_count);
            db.sequelize['cdr-db'].query(sqlCount, {
                type: db.sequelize['cdr-db'].QueryTypes.SELECT,
                replacements: {
                    start_time: start_time,
                    end_time: end_time,
                    uuid: uuid,
                    calls: Calls
                }
            }).then(result => {
                resolve(result)
            }).catch(err => {
                reject(err)
            })
        })
    }

    DataActionAgents(agents, start_time, end_time) {
        return new Promise((resolve, reject) => {
            let agent_id = agents.map(item => item.user_id)
            console.log(agent_id)
            if(agent_id && agent_id.length !== 0) {
                let sql = `select agent_log.user_id, agent_log.action_name, SUM(agent_log.finish_at - agent_log.start_at)
                       from agent_log_events as agent_log
                       where agent_log.user_id in (:agent_id)
                         AND (agent_log.action_name = 'on-break' OR agent_log.action_name = 'waiting-call')
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
                    console.log(err)
                    reject(err)
                })
            }else{
                resolve([])
            }
        })
    }

    filterData(campaign_id, agents, listcallfile_id) {
        return new Promise((resolve, reject) => {
            if (campaign_id && campaign_id.length !== 0) {
                if (agents && agents.length !== 0) {
                    this.ListCallFile(campaign_id, listcallfile_id).then(list => {
                        resolve({
                            success: true,
                            agents: agents,
                            list: list
                        })
                    }).catch(err => {
                        reject(err)
                    })
                } else {
                    db['users'].findAll({
                        where: {
                            campaign_id: campaign_id,
                            active: 'Y'
                        }
                    }).then(agent => {
                        this.ListCallFile(campaign_id, listcallfile_id).then(list => {
                            let data_agent = agent.map(item => item.dataValues)
                            resolve({
                                success: true,
                                agents: data_agent,
                                list: list
                            })
                        })
                    }).catch(err => {
                        reject(err)
                    })
                }
            } else {
                if (agents && agents.length !== 0) {
                    let campaigns = agents.map(item => item.campaign_id)
                    this.ListCallFile(campaigns, listcallfile_id).then(list => {
                        resolve({
                            success: true,
                            agents: agents,
                            list: list
                        })
                    }).catch(err => {
                        reject(err)
                    })

                } else {
                    resolve({
                        success: false
                    })
                }
            }
        })
    }

    agentCallReports(req, res, next) {
        let _this = this;
        const params = req.body;
        let {
            account_code,
            campaign_ids,
            agent_uuids,
            dataAgents,
            listCallFiles_ids,
            status,
            dateSelected_to,
            dateSelected_from,
            start_time,
            end_time
        } = params;
        console.log(params)
        const limit = parseInt(params.limit) > 0 ? params.limit : 1000;
        const page = params.page || 1;
        const offset = (limit * (page - 1));
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
                    if (agent_uuids && agent_uuids.length === 0) {
                        this.db['users'].findAll({
                            where: {
                                active: 'Y',
                                user_type: 'agent',
                                campaign_id: {
                                    $in: campaign_ids
                                }
                            }

                        }).then((agents_camp) => {
                            agent_uuids = agents_camp.map(item_ag => item_ag.sip_device.uuid)
                            dataAgents = agents_camp
                            resolve(true)
                        })
                    } else {
                        resolve(true)
                    }

                }).catch(err => {
                    reject(err)
                })
            } else {
                resolve(true)
            }
        })
        Promise.all([promiseParams]).then(data_params => {
            let sqlCount = `select count(*)
                                from acc_cdrs
                                WHERE SUBSTRING("custom_vars", 0, POSITION(':' in "custom_vars")) = :account_code
                                  AND agent IS NOT NULL
                                    EXTRA_WHERE`
            let extra_where_countCurrenDate = '';
            if (start_time && start_time !== '') {
                extra_where_countCurrenDate += ' AND start_time >= :start_time';
            }
            if (end_time && end_time !== '') {
                extra_where_countCurrenDate += ' AND end_time <=  :end_time';
            }
            if (agent_uuids !== '' && agent_uuids.length !== 0) {
                extra_where_countCurrenDate += ' AND agent in (:agent_uuids)';
            }
            if (listCallFiles_ids && listCallFiles_ids.length !== 0) {
                console.log("heree !")
                extra_where_countCurrenDate += ' AND CAST(REVERSE(SUBSTRING(reverse(custom_vars), 0, POSITION(\':\' IN reverse(custom_vars)))) AS int) in (:listCallFiles_ids)';
            }
            sqlCount = sqlCount.replace('EXTRA_WHERE', extra_where_countCurrenDate);
            db.sequelize['cdr-db'].query(sqlCount, {
                type: db.sequelize['cdr-db'].QueryTypes.SELECT,
                replacements: {
                    start_time: moment(dateSelected_from).format('YYYY-MM-DD').concat(' ', start_time),
                    end_time: moment(dateSelected_to).format('YYYY-MM-DD').concat(' ', end_time),
                    agent_uuids: agent_uuids,
                    account_code: account_code,
                    listCallFiles_ids: listCallFiles_ids,
                }
            }).then(countAll => {
                if (countAll && parseInt(countAll[0].count) === 0) {
                    res.send({
                        success: true,
                        status: 200,
                        data: [],
                        countAll: countAll[0].count
                    })
                    return
                }
                let pages = Math.ceil(countAll[0].count / params.limit);
                let sqlData = ` select count(*)                                                                      as total_appel,
                                           sum(durationsec::int) / 60                                                    AS talk_duration,
                                           cast(cast((sum(durationsec::int) / 60) AS float) / count(*) AS DECIMAL(5, 3)) as avg_talking,
                                           agent
                                    from acc_cdrs
                                    WHERE SUBSTRING("custom_vars", 0, POSITION(':' in "custom_vars")) = :account_code
                                      AND agent IS NOT NULL
                                      AND id >= (select id
                                                 from acc_cdrs
                                                 where SUBSTRING("custom_vars", 0, POSITION(':' in "custom_vars")) =
                                                       '703596960803'
                                        EXTRA_WHERE
                                        LIMIT 1
                                    OFFSET :offset ) EXTRA_WHERE_PARAMS
                                    group by agent
                                        LIMIT :limit`
                let extra_where_currentDate = '';
                if (start_time && start_time !== '') {
                    extra_where_currentDate += ' AND start_time >= :start_time';
                }
                if (end_time && end_time !== '') {
                    extra_where_currentDate += ' AND end_time <=  :end_time';
                }
                if (agent_uuids !== '' && agent_uuids.length !== 0) {
                    extra_where_currentDate += ' AND agent in (:agent_uuids)';
                }
                if (listCallFiles_ids && listCallFiles_ids.length !== 0) {
                    console.log("hey !!!")
                    extra_where_currentDate += ' AND CAST(REVERSE(SUBSTRING(reverse(custom_vars), 0, POSITION(\':\' IN reverse(custom_vars)))) AS int) in (:listCallFiles_ids)';
                }
                sqlData = sqlData.replace('EXTRA_WHERE', extra_where_currentDate);
                sqlData = sqlData.replace('EXTRA_WHERE_PARAMS', extra_where_currentDate);
                db.sequelize['cdr-db'].query(sqlData, {
                    type: db.sequelize['cdr-db'].QueryTypes.SELECT,
                    replacements: {
                        date: parseInt(dateSelected_from),
                        start_time: moment(dateSelected_from).format('YYYY-MM-DD').concat(' ', start_time),
                        end_time: moment(dateSelected_to).format('YYYY-MM-DD').concat(' ', end_time),
                        agent_uuids: agent_uuids,
                        account_code: account_code,
                        listCallFiles_ids: listCallFiles_ids,
                        offset: offset,
                        limit: limit
                    }
                }).then(dataCurrentDate => {
                    console.log(dataCurrentDate)
                    if (dataCurrentDate && dataCurrentDate.length === 0) {
                        res.send({
                            success: true,
                            status: 200,
                            data: [],
                            pages: pages,
                            countAll: countAll[0].count
                        })
                        return
                    }
                    let statsDetails = []
                    PromiseBB.each(dataAgent, item => {
                        let _item = JSON.parse(JSON.stringify(item))
                        let account_data = dataCurrentDate.filter(item_acc => item_acc.agent === item.sip_device.uuid);
                        if (account_data && account_data.length !== 0) {
                            _item.stats = account_data[0];
                        } else {
                            _item.stats = {
                                total_appel: 0,
                                avg_talking: 0,
                                talk_duration: 0
                            }
                        }
                        statsDetails.push(_item)
                    }).then(stats_dataA => {
                        res.send({
                            success: true,
                            status: 200,
                            data: statsDetails,
                            pages: pages,
                            countAll: countAll[0].count
                        })
                    })

                }).catch(err => {
                    _this.sendResponseError(res, [], err)
                })
            })
        })

    }

    listCallFileReports(req, res, next) {
        let _this = this;
        const params = req.body;
        let dataAgent = params.dataAgents
        let dataCallStatus = params.dataCallStatus
        let {
            account_id,
            start_time,
            end_time,
            account_code,
            agent_uuids,
            listCallFiles_ids,
            dateSelected_to,
            dateSelected_from,
            campaign_ids,
            call_status,
            roleCrmAgent
        } = params;
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
                    if (agent_uuids && agent_uuids.length === 0) {
                        this.db['users'].findAll({
                            where: {
                                active: 'Y',
                                role_crm_id: roleCrmAgent,
                                campaign_id: {
                                    $in: campaign_ids
                                }
                            }
                        }).then((agents_camp) => {
                            agent_uuids = agents_camp.map(item_ag => item_ag.user_id);
                            dataAgent = agents_camp;
                            resolve(true);
                        })
                    } else {
                        resolve(true);
                    }
                    if (call_status && call_status.length === 0) {
                        this.db['callstatuses'].findAll({
                            where: {
                                active: 'Y',
                                $or: [
                                    {
                                        is_system:
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
                            dataCallStatus = call_status_list;
                        })
                    }
                }).catch(err => {
                    reject(err);
                })
            } else {
                this.db['campaigns'].findAll({
                    where: {
                        active: 'Y',
                        account_id: account_id
                    }

                }).then((listCampaigns) => {
                    campaign_ids = listCampaigns.map(item_camp => item_camp.campaign_id);
                    resolve(true);
                }).catch(err => {
                    reject(err);
                })
            }
        })
        Promise.all([promiseParams]).then(data_params => {
            let sqlCallsStats = `
                select call_s.callstatus_id,
                       call_s.code,
                       call_s.label,
                       case
                           WHEN stats.total is null THEN 0
                           ELSE stats.total
                           END
                from callstatuses call_s
                         left join (
                    select callS.callstatus_id, callS.code, count(*) as total
                    from callstatuses as callS
                             left join callfiles as callF On callF.call_status = callS.code
                             left join calls_historys as callH On callH.call_file_id = callF.callfile_id
                    where 1 = 1
                        EXTRA_WHERE
                    group by callS.code, callS.callstatus_id)
                    as stats On stats.callstatus_id = call_s.callstatus_id
                where (EXTRA_WHERE_CAMP or call_s.is_system = 'Y')
                  and call_s.active = 'Y' EXTRA_WHERE_STATUS
                order by total desc
            `
            let extra_where = '';
            let extra_where_camp = '';
            let extra_where_status = '';
            if (start_time && start_time !== '') {
                extra_where += ' AND callH.started_at >= :start_time';
            }
            if (end_time && end_time !== '') {
                extra_where += ' AND  callH.finished_at <=  :end_time';
            }
            if (agent_uuids !== '' && agent_uuids.length !== 0) {
                extra_where += ' AND callH.agent_id in (:agent_uuids)';
            }

            if (call_status && call_status !== '' && call_status.length !== 0) {
                extra_where += ' AND callS.callstatus_id in (:call_status)';
                extra_where_status += ' AND call_s.callstatus_id in (:call_status)';
            }
            if (listCallFiles_ids !== '' && listCallFiles_ids.length !== 0) {
                extra_where += ' AND callF.listcallfile_id in(:listCallFiles_ids)';
            }
            if (campaign_ids !== '' && campaign_ids.length !== 0) {
                extra_where += ' AND callS.campaign_id in(:campaign_ids)';
                extra_where_camp += '  call_s.campaign_id in(:campaign_ids)'
            }
            sqlCallsStats = sqlCallsStats.replace('EXTRA_WHERE', extra_where);
            sqlCallsStats = sqlCallsStats.replace('EXTRA_WHERE_CAMP', extra_where_camp);
            sqlCallsStats = sqlCallsStats.replace('EXTRA_WHERE_STATUS', extra_where_status);
            db.sequelize['crm-app'].query(sqlCallsStats, {
                type: db.sequelize['crm-app'].QueryTypes.SELECT,
                replacements: {
                    start_time: dateSelected_from.concat(' ', start_time),
                    end_time: dateSelected_to.concat(' ', end_time),
                    agent_uuids: agent_uuids,
                    account_code: account_code,
                    listCallFiles_ids: listCallFiles_ids,
                    call_status: call_status,
                    campaign_ids: campaign_ids
                }
            }).then(data_stats => {
                res.send({
                    success: true,
                    data: data_stats,
                    status: 200
                })
            }).catch(err => {
                return this.sendResponseError(res, ['Error.CannotGetFromCallStatus'], 1, 403)
            })
        })
    }


}

module.exports = agents;
