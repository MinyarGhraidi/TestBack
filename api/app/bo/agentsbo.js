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
const {Sequelize} = require("sequelize");
const Op = require("sequelize");
const {promise, reject} = require("bcrypt/promises");
let _usersbo = new usersbo;
const appSocket = new (require('../providers/AppSocket'))();
const appHelper = require("../helpers/app");
const app_config = appHelper.appConfig;

class agents extends baseModelbo {
    constructor() {
        super('agents', 'user_id');
        this.baseModal = 'agents';
        this.primaryKey = 'user_id'
    }

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

                        //this.sendResponseError(res, ['Error.EmailNotFound'], 0, 403);
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

    changeStatus(req,res,next){
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
                            let updated_Status = {
                                status : status,
                                updated_at : new Date(),
                                sip_device : sip_device
                            }
                        this.db['users'].update(updated_Status, {
                            where: {
                                user_id: user_id,
                                active: 'Y'
                            }
                        }).then(() => {
                            res.send({
                                        status: 200,
                                        message: "success",
                                        success: true
                                    })
                        }).catch(err => {
                            return this.sendResponseError(res, ['Error.CannotUpdateUserDB'], 0, 403);
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

    saveAgent(req, res, next) {
        let _this = this;
        let {values, accountcode, bulkNum, is_agent} = req.body;
        if (!!!bulkNum) {
            _this.sendResponseError(res, ['Error.BulkNum is required'])
            return
        }
        let sip_device = JSON.parse(JSON.stringify(values.sip_device));
        sip_device.status = 'logged-out'
        sip_device.enabled = true
        let AddAgent = new Promise((resolve, reject) => {
            let idx = 0
            bulkNum.forEach(item_ag => {
                this.db['users'].findOne({
                    where: {active: 'Y', role_crm_id: values.role_crm_id},
                    order: [['user_id', 'DESC']]
                })
                    .then(lastAgent => {
                        let increment = item_ag ? item_ag + 1 : 1;
                        let lastAgentSip_device = lastAgent ? lastAgent.sip_device : values.sip_device
                        let lastAgentKamailioUsername = lastAgent ? lastAgentSip_device.username : values.username;
                        let username = (parseInt(lastAgentKamailioUsername) + increment).toString();
                        let {password, domain, options, status} = sip_device;
                        sip_device.username = username;
                        sip_device.created_at = moment().format("YYYY-MM-DD HH:mm:ss");
                        sip_device.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");
                        sip_device.status = "logged-out";
                        sip_device.accountcode = accountcode;
                        values.sip_device = sip_device;
                        console.log(values)
                        _usersbo.isUniqueUsername(values.username, 0)
                            .then(isUnique => {
                                if (isUnique) {
                                    let data_subscriber = {
                                        username,
                                        domain_uuid: values.domain.params.uuid,
                                        password,
                                        domain: domain
                                    }
                                    axios
                                        .post(`${base_url_cc_kam}api/v1/subscribers`,
                                            data_subscriber,
                                            call_center_authorization)
                                        .then((resp) => {
                                            let result = resp.data.result;
                                            let agent = {
                                                name: values.first_name + " " + values.last_name,
                                                domain_uuid: result.domain_uuid,
                                                subscriber_uuid: result.uuid,
                                                status,
                                                options
                                            };
                                            axios
                                                .post(`${base_url_cc_kam}api/v1/agents`, agent, call_center_authorization)
                                                .then((resp) => {
                                                    values.sip_device.uuid = resp.data.result.uuid || null;
                                                    this.saveAgentInDB(values, is_agent,bulkNum)
                                                        .then(agent => {
                                                            if (idx < bulkNum.length - 1) {
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
                                } else {
                                    if (idx < bulkNum.length - 1) {
                                        idx++
                                    } else {
                                        resolve({message: 'username already exist'})
                                    }
                                }
                            })
                            .catch(err => {
                                reject(err)
                            })
                    })
                    .catch(err => {
                        reject(err)
                    })
            })
        })
        Promise.all([AddAgent]).then(saveAgent => {
            res.send({
                success: true,
                status: 200
            })
        }).catch(err => {
            reject(err)
        })

    }

    updateAgent(req, res, next) {
        let _this = this;
        let values = req.body.values;
        let is_agent = req.body.is_agent;
        let accountcode = req.body.accountcode;
        let {sip_device} = values;
        let {username, password, options, status, enabled, subscriber_id} = sip_device;
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
                                            username,
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
                                                console.log(update_Agent)
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
                                                        username,
                                                        created_at: resultAgent.created_at,
                                                        updated_at: new Date(),
                                                        accountcode,
                                                        subscriber_id
                                                    };
                                                    update_user.updated_at = new Date();
                                                        _usersbo
                                                            .saveUserFunction(update_user, is_agent)
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
                                                    console.log(err.response.data)
                                                    return _this.sendResponseError(res, ['Error.CannotUpdateAgent'], 1, 403);
                                                })
                                            }).catch((err) => {
                                            return _this.sendResponseError(res, ['Error.CannotUpdateSubscriber'], 1, 403);
                                        })
                                    }).catch((err) => {
                                    console.log(err)
                                    return _this.sendResponseError(res, ['Error.CannotGetSubscriber'], 1, 403);
                                })
                            }).catch((err) => {
                            return _this.sendResponseError(res, ['Error.CannotGetAgent'], 1, 403);
                        })
                    }).catch((err) => {
                        return _this.sendResponseError(res, ['Error.CannotFindUser'], 1, 403);
                    })
                }else {
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

    saveAgentInDB(values, is_agent,bulkNum) {
        return new Promise((resolve, reject) => {
            _usersbo
                .saveUserFunction(values, is_agent,bulkNum)
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

    deleteAgentFunc(uuid, agent_id) {
        return new Promise((resolve, reject) => {
            axios
                .delete(`${base_url_cc_kam}api/v1/agents/${uuid}`, call_center_authorization)
                .then(() => {
                    this.db['users'].update({active: 'N'}, {where: {user_id: agent_id}})
                        .then(() => {
                            this.db['meetings'].update({active: 'N'}, {where: {agent_id: agent_id}})
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

    deleteAgent(req, res, next) {
        let _this = this;
        let uuid = req.body.user_uuid;
        let agent_id = req.body.user_id;
        this.deleteAgentFunc(uuid, agent_id)
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

    onConnect(req, res, next) {
        let _this = this;
        let {user_id, uuid, crmStatus, telcoStatus} = req.body;
        this.onConnectFunc(user_id, uuid, crmStatus, telcoStatus)
            .then((user) => {
                let {sip_device, first_name, last_name, user_id} = user.agent.user;
                let data_agent = {
                    user_id: user_id,
                    first_name: first_name,
                    last_name: last_name,
                    uuid: sip_device.uuid,
                    crmStatus: user.agent.user.params.status,
                    telcoStatus: sip_device.status,
                    updated_at: sip_device.updated_at
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
        let created_at = moment().format("YYYY-MM-DD HH:mm:ss")
        return new Promise((resolve, reject) => {
            if (crmStatus === "in_call" || crmStatus === "in_qualification" || crmStatus === "waiting-call" || crmStatus === "on-break" || crmStatus === "connected") {
                this.db["users"].findOne({where: {user_id: user_id}})
                    .then(user => {
                        if (user) {
                            let params = user.params;
                            user.updated_at = moment(new Date());
                            this.updateAgentStatus(user_id, user, crmStatus, created_at, params)
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
                                                agent.updated_at = moment(new Date());
                                                this.updateAgentStatus(user_id, agent, crmStatus, created_at, params)
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

    updateAgentStatus(user_id, agent_, crmStatus, created_at, params) {
        let updatedAt_tz = moment(created_at).format("YYYY-MM-DD HH:mm:ss");
        return new Promise((resolve, reject) => {
            let agent;
            agent = {user_id: user_id, sip_device: agent_, params: params};
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

    getConnectedAgents(req, res, next) {
        let _this = this;
        let {account_id} = req.body;
        this.getCampaigns_ids()
            .then(campaigns_ids => {
                let where = {active: 'Y', account_id: account_id, user_type: "agent", campaign_id: campaigns_ids}

                this.db['users'].findAll({where: where})
                    .then(agents => {
                        let loggedAgents = agents.filter(el => el.sip_device.status !== "logged-out");
                        let formattedData = loggedAgents.map(user => {
                            let {sip_device, first_name, last_name, user_id, campaign_id} = user;
                            return {
                                user_id: user_id,
                                first_name: first_name,
                                last_name: last_name,
                                uuid: sip_device.uuid,
                                crmStatus: user.params.status,
                                telcoStatus: sip_device.status,
                                updated_at: sip_device.updated_at,
                                campaign_id: campaign_id
                            };
                        })
                        res.send({
                            status: "200",
                            message: "success",
                            data: formattedData
                        })
                    })
                    .catch(err => {
                        return _this.sendResponseError(res, ['Error.cannot fetch list agents', err], 1, 403);
                    })

            })
            .catch(err => {
                return _this.sendResponseError(res, ['Error.cannot fetch list agents', err], 1, 403);
            })
    }

    filterDashboard(req, res, next) {
        let _this = this;
        let {account_id, campaign_id, agent_id, status} = req.body;
        let where = {active: 'Y', account_id: account_id, user_type: "agent"}

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
                let loggedAgents = agents.filter(el => el.sip_device.status !== "logged-out");
                let formattedData = loggedAgents.map(user => {
                    let {sip_device, first_name, last_name, user_id, campaign_id} = user;
                    return {
                        user_id: user_id,
                        first_name: first_name,
                        last_name: last_name,
                        uuid: sip_device.uuid,
                        crmStatus: user.params.status,
                        telcoStatus: sip_device.status,
                        updated_at: sip_device.updated_at,
                        campaign_id: campaign_id
                    };
                })
                res.send({
                    status: "200",
                    message: "success",
                    data: formattedData
                })
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Error.cannot fetch list agents', err], 1, 403);
            })
    }

    onDisconnect(item) {
        return new Promise((resolve, reject) => {
            this.onConnectFunc(item.user_id, item.uuid, 'connected', 'on-break')
                .then((user) => {
                    let {sip_device, first_name, last_name, user_id} = user.agent.user;
                    let data_agent = {
                        user_id: user_id,
                        first_name: first_name,
                        last_name: last_name,
                        uuid: sip_device.uuid,
                        crmStatus: user.agent.user.params.status,
                        telcoStatus: sip_device.status,
                        updated_at: sip_device.updated_at
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
            data_agent.forEach(item => {
                this.onDisconnect(item).then(result => {
                    if (result) {
                        if (i < data_agent.length - 1) {
                            i++;
                        } else {
                            resolve({
                                success: true,

                            })
                        }
                    } else {
                        reject({
                            success: false
                        })
                    }
                })

            })
        })
        Promise.all([promiseDisconnect]).then(result => {
            if (result) {
                res.send({
                    status: 200,
                    message: 'success'
                })
            } else {
                return this.sendResponseError(res, ['Error.cannot fetch list agents'], 1, 403);
            }
        })
    }

    agentDetailsReports(req, res, next) {
        const filter = req.body || null;

        this.filterData(filter.campaign_id, filter.agents, filter.listcallfile_id).then(data => {
            if (data.success) {
                this.DataCallsAgents(data.agents, data.list, filter.dateSelected.concat(' ', filter.start_time), filter.dateSelected.concat(' ', filter.end_time), filter.dateSelected).then(data_call => {
                    this.DataActionAgents(data.agents, filter.dateSelected.concat(' ', filter.start_time), filter.dateSelected.concat(' ', filter.end_time), filter.dateSelected).then(data_actions => {
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
                        return this.sendResponseError(res, ['Error.cannot fetch list agents', err], 1, 403);
                    })

                }).catch(err => {
                    return this.sendResponseError(res, ['Error.cannot fetch list agents', err], 1, 403);
                })
            }

        }).catch(err => {
            return this.sendResponseError(res, ['Error.cannot fetch list agents', err], 1, 403);
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

    DataCallsAgents(agents, list_Call, start_time, end_time, date) {
        return new Promise((resolve, reject) => {
            let current_Date = moment(new Date()).tz(app_config.TZ).format('YYYYMMDD');
            let uuid = agents.map(item =>
                item.sip_device.uuid
            )

            let Calls = list_Call.map(item =>
                item.callfile_id
            )

            if (date !== current_Date) {
                let sqlCount = `select ac.agent,
                                       count(*),
                                       SUM(CAST(ac.durationsec AS INTEGER)) / 60 as total,
                                       SUM(CAST(ac.durationsec AS INTEGER) + CAST(ac.durationmsec AS INTEGER) / 1000) /
                                       60 / count(*)                             as moy
                                from cdrs_:date as ac
                                WHERE agent in (:uuid)
                                  AND CAST ((string_to_array("custom_vars"
                                    , ':'))[3] AS INTEGER) in (:calls)
                                    EXTRA_WHERE
                                GROUP BY ac.agent`
                let extra_where_count = '';
                if (start_time && start_time !== '') {
                    extra_where_count += ' AND start_time >= :start_time';
                }
                if (end_time && end_time !== '') {
                    extra_where_count += ' AND end_time <=  :end_time';
                }
                sqlCount = sqlCount.replace('EXTRA_WHERE', extra_where_count);
                db.sequelize['cdr-db'].query(sqlCount, {
                    type: db.sequelize['cdr-db'].QueryTypes.SELECT,
                    replacements: {
                        date: parseInt(date),
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
            } else {
                let sqlCount = `select ac.agent,
                                       count(*),
                                       SUM(CAST(ac.durationsec AS INTEGER)) / 60 as total,
                                       SUM(CAST(ac.durationsec AS INTEGER) + CAST(ac.durationmsec AS INTEGER) / 1000) /
                                       60 / count(*)                             as moy
                                from acc_cdrs as ac
                                WHERE agent in (:uuid)
                                  AND CAST((string_to_array("custom_vars", ':'))[3] AS INTEGER) in (:calls)
                                    EXTRA_WHERE
                                GROUP BY ac.agent`

                let extra_where_count = '';
                if (start_time && start_time !== '') {
                    extra_where_count += ' AND start_time >= :start_time';
                }
                if (end_time && end_time !== '') {
                    extra_where_count += ' AND end_time <=  :end_time';
                }
                sqlCount = sqlCount.replace('EXTRA_WHERE', extra_where_count);
                db.sequelize['cdr-db'].query(sqlCount, {
                    type: db.sequelize['cdr-db'].QueryTypes.SELECT,
                    replacements: {
                        date: parseInt(date),
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
            }
        })
    }

    DataActionAgents(agents, start_time, end_time) {
        return new Promise((resolve, reject) => {
            let agent_id = agents.map(item => item.user_id)
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
                reject(err)
            })
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
        const limit = parseInt(params.limit) > 0 ? params.limit : 1000;
        const page = params.page || 1;
        const offset = (limit * (page - 1));
        let dataAgent = params.dataAgents
        let current_Date = moment(new Date()).tz(app_config.TZ).format('YYYYMMDD');
        let {start_time, end_time, account_code, agent_uuids, listCallFiles_ids, date, campaign_ids} = params;
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
                            dataAgent = agents_camp
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
            if (date !== current_Date) {
                let sqlCount = `select count(*)
                                from cdrs_:date
                                WHERE SUBSTRING ("custom_vars"
                                    , 0
                                    , POSITION (':' in "custom_vars") ) = :account_code
                                  AND agent IS NOT NULL
                                    EXTRA_WHERE`
                let extra_where_count = '';
                if (start_time && start_time !== '') {
                    extra_where_count += ' AND start_time >= :start_time';
                }
                if (end_time && end_time !== '') {
                    extra_where_count += ' AND end_time <=  :end_time';
                }
                if (agent_uuids !== '' && agent_uuids.length !== 0) {
                    extra_where_count += ' AND agent in (:agent_uuids)';
                }
                if (listCallFiles_ids !== '' && listCallFiles_ids.length !== 0) {
                    extra_where_count += ' AND CAST(REVERSE(SUBSTRING(reverse(custom_vars), 0, POSITION(\':\' IN reverse(custom_vars)))) AS int) in (:listCallFiles_ids)';
                }
                sqlCount = sqlCount.replace('EXTRA_WHERE', extra_where_count);
                db.sequelize['cdr-db'].query(sqlCount, {
                    type: db.sequelize['cdr-db'].QueryTypes.SELECT,
                    replacements: {
                        date: parseInt(date),
                        start_time: moment(date).format('YYYY-MM-DD').concat(' ', start_time),
                        end_time: moment(date).format('YYYY-MM-DD').concat(' ', end_time),
                        agent_uuids: agent_uuids,
                        account_code: account_code,
                        listCallFiles_ids: listCallFiles_ids
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
                    let sql = ` select count(*)                                                                      as total_appel,
                                       sum(durationsec::int) / 60                                                    AS talk_duration,
                                       cast(cast((sum(durationsec::int) / 60) AS float) / count(*) AS DECIMAL(5, 3)) as avg_talking,
                                       agent
                                from cdrs_:date
                                WHERE id >= (select id from cdrs_: date WHERE SUBSTRING ("custom_vars"
                                    , 0
                                    , POSITION (':' in "custom_vars") ) = :account_code
                                  AND agent IS NOT NULL
                                    EXTRA_WHERE
                                    ORDER BY id DESC
                                    LIMIT 1
                                    OFFSET : offset)
                                    EXTRA_WHERE-PARAMS
                                group by agent
                                    LIMIT :limit`
                    let extra_where = '';
                    if (start_time && start_time !== '') {
                        extra_where += ' AND start_time >= :start_time';
                    }
                    if (end_time && end_time !== '') {
                        extra_where += ' AND end_time <=  :end_time';
                    }
                    if (agent_uuids !== '' && agent_uuids.length !== 0) {
                        extra_where += ' AND agent in (:agent_uuids)';
                    }
                    if (listCallFiles_ids !== '' && listCallFiles_ids.length !== 0) {
                        extra_where_count += ' AND CAST(REVERSE(SUBSTRING(reverse(custom_vars), 0, POSITION(\':\' IN reverse(custom_vars)))) AS int) in (:listCallFiles_ids)';
                    }
                    sql = sql.replace('EXTRA_WHERE', extra_where);
                    sql = sql.replace('EXTRA_WHERE-PARAMS', extra_where);
                    db.sequelize['cdr-db'].query(sql, {
                        type: db.sequelize['cdr-db'].QueryTypes.SELECT,
                        replacements: {
                            date: parseInt(date),
                            start_time: moment(date).format('YYYY-MM-DD').concat(' ', start_time),
                            end_time: moment(date).format('YYYY-MM-DD').concat(' ', end_time),
                            agent_uuids: agent_uuids,
                            account_code: account_code,
                            listCallFiles_ids: listCallFiles_ids,
                            offset: offset,
                            limit: limit
                        }
                    }).then(dataOtherDate => {
                        if (dataOtherDate && dataOtherDate.length !== 0) {
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
                            let _item = JSON.parse(JSON.stringify(item));
                            let account_data = dataOtherDate.filter(item_acc => item_acc.agent === item.sip_device.uuid);
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
                        }).then(stats_data => {
                            res.send({
                                success: true,
                                status: 200,
                                data: statsDetails,
                                pages: pages,
                                countAll: countAll[0].count
                            })
                        })

                    }).catch(err => {
                        _this.sendResponseError(res, [], err);
                    })
                }).catch(err => {
                    _this.sendResponseError(res, [], err);
                })
            } else {
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
                if (listCallFiles_ids !== '' && listCallFiles_ids.length !== 0) {
                    extra_where_countCurrenDate += ' AND CAST(REVERSE(SUBSTRING(reverse(custom_vars), 0, POSITION(\':\' IN reverse(custom_vars)))) AS int) in (:listCallFiles_ids)';
                }
                sqlCount = sqlCount.replace('EXTRA_WHERE', extra_where_countCurrenDate);
                db.sequelize['cdr-db'].query(sqlCount, {
                    type: db.sequelize['cdr-db'].QueryTypes.SELECT,
                    replacements: {
                        date: parseInt(date),
                        start_time: moment(date).format('YYYY-MM-DD').concat(' ', start_time),
                        end_time: moment(date).format('YYYY-MM-DD').concat(' ', end_time),
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
                    if (listCallFiles_ids !== '' && listCallFiles_ids.length !== 0) {
                        extra_where_currentDate += ' AND CAST(REVERSE(SUBSTRING(reverse(custom_vars), 0, POSITION(\':\' IN reverse(custom_vars)))) AS int) in (:listCallFiles_ids)';
                    }
                    sqlData = sqlData.replace('EXTRA_WHERE', extra_where_currentDate);
                    sqlData = sqlData.replace('EXTRA_WHERE_PARAMS', extra_where_currentDate);
                    db.sequelize['cdr-db'].query(sqlData, {
                        type: db.sequelize['cdr-db'].QueryTypes.SELECT,
                        replacements: {
                            date: parseInt(date),
                            start_time: moment(date).format('YYYY-MM-DD').concat(' ', start_time),
                            end_time: moment(date).format('YYYY-MM-DD').concat(' ', end_time),
                            agent_uuids: agent_uuids,
                            account_code: account_code,
                            listCallFiles_ids: listCallFiles_ids,
                            offset: offset,
                            limit: limit
                        }
                    }).then(dataCurrentDate => {
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
            }
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
            date,
            campaign_ids,
            call_status
        } = params;
        date = moment(date).format('YYYY-MM-DD')
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
                    date: parseInt(date),
                    start_time: date.concat(' ', start_time),
                    end_time: date.concat(' ', end_time),
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
                reject(err);
            })
        })
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
                  return   reject(false);
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
                                this.db['users'].update({active: 'N'}, {where: {user_id: user_id}})
                                    .then(() => {
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
                                    })
                                    .catch((err) => {
                                        reject(err);
                                    });
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
}

module.exports = agents;
