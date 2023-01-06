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
    saveUserAgent(req, res, next) {
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
            this.bulkUserAgents(bulkNum, values.username, values).then((users) => {
                if (!users.success) {
                    res.send({
                        success: false,
                        status: 403,
                        message: users.message
                    })
                }
                let addAgent = new Promise((resolve, reject) => {
                    users.data.forEach((user) => {
                        this.saveOneUserAgent(user)
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
                    return this.sendResponseError(res, ['Error.CannotAddAgents'], 0, 403);
                })
            }).catch((err) => {
                return this.sendResponseError(res, ['Error.CannotAddAgents'], 0, 403);
            })
        }
    }

    bulkUserAgents(bulkNum, NewUserName, user) {
        return new Promise((resolve, reject) => {
            let idx = 0;
            let arrayUsers = [];
            if (bulkNum.length === 1) {
                _usersbo.isUniqueUsername(NewUserName, 0, user.account_id).then(isUnique => {
                    if (!isUnique) {
                        resolve({
                            success: false,
                            message: 'This username is already exist'
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
                _usersbo._generateUserName(user.account_id).then(userName => {
                    bulkNum.forEach((inc) => {
                        let parseUserName = parseInt(userName) + inc;
                        let TestuserName = parseUserName.toString();
                        _usersbo.isUniqueUsername(TestuserName, 0, user.account_id).then(isUnique => {
                            if (!isUnique) {
                                _usersbo._generateUserName(user.account_id).then(secondGenUserName => {
                                    TestuserName = parseInt(secondGenUserName) + 1;
                                    let newUser = {
                                        ...user,
                                        sip_device: {
                                            ...user.sip_device,
                                            username: secondGenUserName.toString(),
                                            password: secondGenUserName.toString()
                                        },
                                        params: {
                                            ...user.params,
                                            pass_web: secondGenUserName.toString()
                                        },
                                        username: secondGenUserName.toString(),
                                        first_name: secondGenUserName.toString(),
                                        password_hash: secondGenUserName.toString()
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
                                let newUser = {
                                    ...user,
                                    sip_device: {
                                        ...user.sip_device,
                                        username: TestuserName.toString(),
                                        password: TestuserName.toString()
                                    },
                                    params: {
                                        ...user.params,
                                        pass_web: TestuserName.toString()
                                    },
                                    username: TestuserName.toString(),
                                    first_name: TestuserName.toString(),
                                    password_hash: TestuserName.toString()
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

    saveOneUserAgent(user) {
        return new Promise((resolve, reject) => {
            let {domain, status, options} = user.sip_device;
            let name_agent = user.first_name + " " + user.last_name;
            let data_subscriber = {
                username: user.username,
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
                        }).catch((err) => {
                        reject(err)
                    })
                }).catch((err) => {
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
            // if (crmStatus === "in_call" || crmStatus === "in_qualification") {
            //     this.db["users"].findOne({where: {user_id: user_id}})
            //         .then(user => {
            //             if (user) {
            //                 let params = user.params;
            //                 user.updated_at = moment(new Date());
            //                 this.updateAgentStatus(user_id, user, telcoStatus, crmStatus, params)
            //                     .then((agent) => {
            //                         if (agent.success) {
            //                             resolve({
            //                                 success: true,
            //                                 agent: agent
            //                             });
            //                         } else {
            //                             resolve({
            //                                 success: false,
            //                             });
            //                         }
            //                     })
            //                     .catch((err) => {
            //                         reject(err);
            //                     });
            //             } else {
            //                 resolve({
            //                     success: false
            //                 })
            //             }
            //
            //         })
            //         .catch((err) => {
            //             reject(err);
            //         });
            // } else {
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
                            if (user.params.status === 'logged-out') {
                                this.db['users'].update({current_session_token: null}, {where: {user_id: user.user_id}}).then(() => {
                                    idx++;
                                }).catch(err => {
                                    reject(err)
                                })
                            } else {
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
            let couldDisc = data_agent.filter((agent) => agent.crmStatus !== 'waiting-call' && agent.crmStatus !== 'in_call' && agent.crmStatus!=='in_qualification') || [];
            let cannotDisc = data_agent.filter((agent) => agent.crmStatus === 'waiting-call' || agent.crmStatus === 'in_call' || agent.crmStatus==='in_qualification') || [];
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

    //------- Agent Details Report -------- //
    agentDetailsReports(req, res, next) {
        const filter = req.body || null;
        let {
            account_id,
            campaign_ids,
            dataAgents,
            listCallFiles_ids,
            dateSelected_to,
            dateSelected_from,
            start_time,
            end_time,
            roleCrmAgent} = filter
        this.filterData(campaign_ids, dataAgents, listCallFiles_ids,roleCrmAgent,account_id).then(data => {
            if (data.success) {
                let dataSelect_from = moment(dateSelected_from).format('YYYY-MM-DD').concat(' ', start_time)
                let dataSelect_to = moment(dateSelected_to).format('YYYY-MM-DD').concat(' ', end_time)
                let agents_ids = dataAgents.map(item => item.user_id)
                this.DataCallsAgents(agents_ids, listCallFiles_ids, dataSelect_from, dataSelect_to).then(data_call => {
                    this.DataActionAgents(agents_ids, dataSelect_from, dataSelect_to).then(data_actions => {
                        data.agents.map(item => {
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
                                        count_break : item_action.count
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
    filterData(campaign_id, agents, listcallfile_id,roleCrmAgent,account_id) {
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
                            account_id: account_id,
                            active: 'Y',
                            role_crm_id : roleCrmAgent
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
    DataCallsAgents(agent_ids, list_CallFile_ids, start_time, end_time) {
        return new Promise((resolve, reject) => {
            let sqlData = `select count(DISTINCT CallH.id) as TotalCalls,AVG(CallH.finished_at - CallH.started_at) AS moy , SUM(CallH.finished_at - CallH.started_at) AS DurationCalls, CallH.agent_id
            from calls_historys as CallH
            left join callfiles as CallF On CallF.callfile_id = CallH.call_file_id
            left join listcallfiles as listCallF On CallF.listcallfile_id = listCallF.listcallfile_id
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
            if(list_CallFile_ids && list_CallFile_ids.length !== 0){
                extra_where_count += 'AND listCallF.listcallfile_id in (:listCallFile_ids) ';
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
                    listCallFile_ids : list_CallFile_ids
                }
            }).then(result => {
                resolve(result)
            }).catch(err => {
                reject(err)
            })
        })
    }
    DataActionAgents(agent_id, start_time, end_time) {
        return new Promise((resolve, reject) => {
            if (agent_id && agent_id.length !== 0) {
                let sql = `select agent_log.user_id, agent_log.action_name, SUM(agent_log.finish_at - agent_log.start_at), COUNT(agent_log.action_name)
                       from agent_log_events as agent_log
                       where agent_log.user_id in (:agent_id)
                         AND (agent_log.action_name = 'on-break' OR agent_log.action_name = 'waiting-call' OR agent_log.action_name = 'in_call')
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
            end_time,
            listCallFiles_ids,
            roleCrmAgent,
            start_time,
            account_code
        } = params;
        this.getUsers(agent_ids, campaign_ids,roleCrmAgent,account_id).then(result => {
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
                        resolve(true);
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
                                resolve(true);
                            })
                        }
                    }).catch(err => {
                        reject(err);
                    })
                }
                else {
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
            Promise.all([promiseParams]).then(() => {
                let idx = 0;
                let resultArray = [];
                agent_ids.forEach(agent =>{
                    this.getReportByOneAgent({...params, agent_id : agent}).then(result =>{
                        if(result.success){
                            let currentAgent = dataAgents.filter((item) => item.user_id === agent)
                            resultArray.push({ agent : currentAgent[0], data : result.data});
                        }
                        if (idx < agent_ids.length - 1) {
                            idx++
                        } else {
                            res.send({
                                success : true,
                                data : resultArray,
                                status : 200
                            })
                        }
                    }).catch(err=>{
                        return this.sendResponseError(res,['ErrorCannotGetStatus'],1,403)
                    })
                })
            }).catch(err=>{
                return this.sendResponseError(res,['ErrorCannotGetStatus'],1,403)
            })

        })
    }
    getUsers = (agents_ids, campaign_ids,roleCrmAgent,account_id) => {
        return new Promise((resolve, reject) => {
            let whereQuery = {
                active : 'Y',
                role_crm_id : roleCrmAgent,
                account_id : account_id
            }
            if(agents_ids && agents_ids.length !== 0) {
                whereQuery.user_id = agents_ids;
            }
            this.db['users'].findAll({
                where: whereQuery
            }).then((allAgents) => {
                let users_ids = allAgents.map(user => user.user_id);
                let users_uuids = allAgents.map(user => user.sip_device.uuid);
                resolve({
                    success : true,
                    dataAgents : allAgents,
                    users_ids : users_ids,
                    users_uuids : users_uuids
                })
            }).catch(err => resolve([]))
        })


    }
    getReportByOneAgent(params){
        return new Promise((resolve,reject)=>{
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
                             left join listcallfiles as listCallF On callF.listcallfile_id = listCallF.listcallfile_id
                    where 1 = 1
                        EXTRA_WHERE
                    group by callS.code, callS.callstatus_id)
                    as stats On stats.callstatus_id = call_s.callstatus_id
                where (EXTRA_WHERE_CAMP)
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
            if (agent_id) {
                extra_where += ' AND callH.agent_id = :agent_id';
            }

            if (call_status && call_status !== '' && call_status.length !== 0) {
                extra_where += ' AND callS.callstatus_id in (:call_status)';
                extra_where_status += ' AND call_s.callstatus_id in (:call_status)';
            }
            if (listCallFiles_ids !== '' && listCallFiles_ids.length !== 0) {
                extra_where += ' AND listCallF.listcallfile_id in(:listCallFiles_ids)';
            }
            if (campaign_ids !== '' && campaign_ids.length !== 0) {
                extra_where_camp += "  call_s.campaign_id in(:campaign_ids) or  call_s.is_system = 'Y'"
                extra_where += " AND (callS.campaign_id in(:campaign_ids) OR  callS.is_system = 'Y') "
            }else{
                extra_where_camp += " call_s.is_system = 'Y'"
            }
            sqlCallsStats = sqlCallsStats.replace('EXTRA_WHERE', extra_where);
            sqlCallsStats = sqlCallsStats.replace('EXTRA_WHERE_CAMP', extra_where_camp);
            sqlCallsStats = sqlCallsStats.replace('EXTRA_WHERE_STATUS', extra_where_status);
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
                resolve({
                    success : true,
                    data : data_stats,
                    status : 200
                })
            }).catch(err => {
                reject({
                    success : false,
                    data : [],
                    status : 403
                })
            })
        })
    }

    // --------- Agent Call Report ----------//
    formatUsers(users){
        return new Promise((resolve,reject)=>{
            let newArrayUsers = [];
            users.map(user=>{
                let NewFormat = {
                    user_id : user.user_id,
                    username : user.username,
                    first_name : user.first_name,
                    last_name : user.last_name,
                    profile_image_id : user.profile_image_id
                }
                newArrayUsers.push(NewFormat);
            })
            resolve(newArrayUsers)
        })

    }
    agentCallReports(req, res, next) {
        let _this = this;
        const params = req.body;
        let {
            campaign_ids,
            agent_ids,
            dataAgents,
            listCallFiles_ids,
            dateSelected_to,
            dateSelected_from,
            start_time,
            end_time,
            account_code,
            roleCrmAgent,
            account_id
        } = params;

        const limit = parseInt(params.limit) > 0 ? params.limit : 1000;
        const page = params.page || 1;
        const offset = (limit * (page - 1));
        let dataSelect_from = moment(dateSelected_from).format('YYYY-MM-DD').concat(' ', start_time)
        let dataSelect_to = moment(dateSelected_to).format('YYYY-MM-DD').concat(' ', end_time)
        this.db['users'].findAll({where : {active : 'Y' , user_id : agent_ids}}).then(users =>{
            if(!!!users){
                res.send({
                    success : false
                })
            }else{
                this.formatUsers(users).then(AllAgents=>{
                    let AllUsers = AllAgents;
                    this.DataCallsAgents(agent_ids,listCallFiles_ids,dataSelect_from,dataSelect_to).then(data_call =>{
                        AllUsers.map(item =>{
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
                            success : false,
                            data  : AllUsers
                        })
                    })

                })
            }
        })
    }




}

module.exports = agents;
