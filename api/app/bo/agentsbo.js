const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
const {validateEmail} = require("../helpers/helpers");
const config = require('../config/config.json');
const jwt = require('jsonwebtoken');
const {default: axios} = require("axios");
const call_center_token = require(__dirname + '/../config/config.json')["call_center_token"];

const base_url_cc_kam = require(__dirname + '/../config/config.json')["base_url_cc_kam"];
const call_center_authorization = {
    headers: {Authorization: call_center_token}
};

const usersbo = require('./usersbo');
let _usersbo = new usersbo;

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
                return this.sendResponseError(res, ['Error.AnErrorHasOccuredSaveUser'], 1, 403);
            });
        }).catch((error) => {
            return this.sendResponseError(res, ['Error.AnErrorHasOccuredUser'], 1, 403);
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
                    return this.sendResponseError(res, ['Error.AnErrorHasOccuredUser'], 1, 403);
                });
            }
        }
    }

    saveAgent(req, res, next) {
        let _this = this;
        let values = req.body.values;
        let accountcode = req.body.accountcode;
        let {sip_device} = values;
        let {username, password, domain, options, status, enabled, subscriber_id} = sip_device;
        axios
            .post(`${base_url_cc_kam}api/v1/agents`,
                  { username, password, domain, options, accountcode, status, enabled, subscriber_id},
                       call_center_authorization)
            .then((resp) => {
                let uuid = resp.data.result.uuid || null;
                values.sip_device.uuid = uuid;
                this.saveAgentInDB(values)
                    .then(agent => {
                        res.send({
                            status: 200,
                            message: "success",
                            data: agent
                        })
                    })
                    .catch(err => {
                        return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                    })
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
            });
    }

    updateAgent(req, res, next) {
        let _this = this;
        let values = req.body.values;
        let accountcode = req.body.accountcode;
        let {sip_device} = values;
        let {username, password, domain, options, status, enabled, subscriber_id} = sip_device;
        axios
            .put(`${base_url_cc_kam}api/v1/agents/${sip_device.uuid}`,
                { username, password, domain, options, accountcode, status, enabled, subscriber_id},
                call_center_authorization)
            .then((resp) => {
                this.saveAgentInDB(values)
                    .then(agent => {
                        res.send({
                            status: 200,
                            message: "success",
                            data: agent
                        })
                    })
                    .catch(err => {
                        return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                    })
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
            });
    }

    saveAgentInDB(values) {
        return new Promise((resolve, reject) => {
            _usersbo
                .saveUserFunction(values)
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


}

module.exports = agents;
