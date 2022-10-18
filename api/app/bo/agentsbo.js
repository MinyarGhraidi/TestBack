const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
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

const usersbo = require('./usersbo');
const {Sequelize} = require("sequelize");
const Op = require("sequelize");
const {promise, reject} = require("bcrypt/promises");
const PromiseBB = require("bluebird");
const appHelper = require("../helpers/app");
let _usersbo = new usersbo;
const appSocket = new (require('../providers/AppSocket'))();
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
                        let {password, domain, options, status, enabled, subscriber_id} = sip_device;
                        sip_device.username = username;
                        sip_device.created_at = moment().format("YYYY-MM-DD HH:mm:ss");
                        sip_device.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");
                        sip_device.status = "logged-out";
                        values.sip_device = sip_device;
                        _usersbo.isUniqueUsername(values.username, 0)
                            .then(isUnique => {
                                if (isUnique) {
                                    let agent = {
                                        username,
                                        password,
                                        domain,
                                        options,
                                        accountcode,
                                        status,
                                        enabled,
                                        subscriber_id
                                    };
                                    axios
                                        .post(`${base_url_cc_kam}api/v1/agents`, agent, call_center_authorization)
                                        .then((resp) => {
                                            values.sip_device.uuid = resp.data.result.agent.uuid || null;
                                            this.saveAgentInDB(values, is_agent)
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
                                        .catch((err) => {
                                            reject(err)
                                        });
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
        let {username, password, domain, options, status, enabled, subscriber_id} = sip_device;
        let user_id = req.body.values.user_id;
        _usersbo.isUniqueUsername(values.username, user_id)
            .then(isUnique => {
                if (isUnique) {
                    let dataAgent = {username, password, domain, options, accountcode, status, enabled, subscriber_id}
                    axios
                        .put(`${base_url_cc_kam}api/v1/agents/${sip_device.uuid}`, dataAgent
                            ,
                            call_center_authorization)
                        .then((resp) => {
                            _usersbo
                                .saveUserFunction(values, is_agent)
                                .then(agent => {
                                    res.send({
                                        status: 200,
                                        message: "success",
                                        data: agent,
                                        success: true
                                    })
                                })
                                .catch(err => {
                                    return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
                                })
                        })
                        .catch((err) => {
                            res.send({
                                status: 403,
                                message: 'failed',
                                error_type: 'telco'
                            });
                        });
                } else {
                    res.send({
                        status: 403,
                        success: false,
                        error_type: 'check_username',
                        message: 'This username is already exist'
                    });
                }
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
            })
    }

    saveAgentInDB(values, is_agent) {
        return new Promise((resolve, reject) => {
            _usersbo
                .saveUserFunction(values, is_agent)
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
            if (crmStatus === "in_call" || crmStatus === "in_qualification") {
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
                            WHERE SUBSTRING("custom_vars", 0 , POSITION(':' in "custom_vars") ) = :account_code
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
                        start_time: start_time,
                        end_time: end_time,
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
                    let sql = ` select count(*) as total_appel,
                                       sum(durationsec::int)/60 AS talk_duration , 
                                       cast(cast((sum(durationsec::int)/60) AS float)/count(*) AS DECIMAL(5,3)) as avg_talking,
                                       agent
                                       from cdrs_:date
                                       WHERE id >= (select id from cdrs_:date WHERE SUBSTRING("custom_vars", 0 , POSITION(':' in "custom_vars") ) = :account_code
                                       AND agent IS NOT NULL
                                           EXTRA_WHERE
                                           ORDER BY id DESC
                                           LIMIT 1
                                           OFFSET :offset)
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
                            start_time: start_time,
                            end_time: end_time,
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
                            let _item = item
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
                            WHERE SUBSTRING("custom_vars", 0 , POSITION(':' in "custom_vars") ) = :account_code 
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
                        start_time: start_time,
                        end_time: end_time,
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
                    let sqlData = ` select count(*) as total_appel,
                                           sum(durationsec::int)/60 AS talk_duration , 
                                           cast(cast((sum(durationsec::int)/60) AS float)/count(*) AS DECIMAL(5,3)) as avg_talking,
                                           agent
                                           from acc_cdrs
                                           WHERE SUBSTRING("custom_vars", 0 , POSITION(':' in "custom_vars") ) = :account_code 
                                           AND agent IS NOT NULL
                                           AND id >= ( select id  from acc_cdrs where SUBSTRING("custom_vars", 0 , POSITION(':' in "custom_vars") ) = '703596960803' 
                                           EXTRA_WHERE
                                            LIMIT 1
                                           OFFSET :offset
                                           )
                                           EXTRA_WHERE_PARAMS
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
                            start_time: start_time,
                            end_time: end_time,
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
                            let _item = item
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
                        _this.sendResponseError(res, [], err)
                    })
                })
            }
        })

    }

}

module.exports = agents;
