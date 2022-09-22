const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
const Op = sequelize.Op;
let db = require('../models');
const {appSecret} = require("../helpers/app");
const jwt = require('jsonwebtoken');
const config = require('../config/config.json');
const usersbo = require('../bo/usersbo');
const agentsbo = require('../bo/agentsbo');
const campaignsbo = require('../bo/campaignbo');
const trunksbo = require('../bo/truncksbo');
const {Sequelize} = require("sequelize");
const {default: axios} = require("axios");
let _usersbo = new usersbo();
let _agentsbo = new agentsbo();
let _campaignsbo = new campaignsbo();
let _trunksbo = new trunksbo();
const appSocket = new (require('../providers/AppSocket'))();
const call_center_token = require(__dirname + '/../config/config.json')["call_center_token"];
const base_url_cc_kam = require(__dirname + '/../config/config.json')["base_url_cc_kam"];
const call_center_authorization = {
    headers: {Authorization: call_center_token}
};
class accounts extends baseModelbo {
    constructor() {
        super('accounts', 'account_id');
        this.baseModal = 'accounts';
        this.primaryKey = 'account_id';
    }

    getAccountByToken(req, res, next) {

        jwt.verify(req.headers.authorization.replace('Bearer ', ''), config.secret, (err, decodedToken) => {
            if (err) {
                res.send(err);
            } else {
                this.db['accounts'].findOne({
                    where: {
                        account_id: decodedToken.user_id
                    }
                }).then(user => {
                    res.send(user.dataValues);

                });
            }
        });

    }

    signIn(req, res, next) {
        if ((!req.body.username || !req.body.password)) {
            return this.sendResponseError(res, ['Error.RequestDataInvalid'], 0, 403);
        } else {
            const {username, password} = req.body;
            if (username && password) {
                this.db['accounts'].findOne({
                    where: {
                        first_name: username,
                        active: 'Y'
                    }

                }).then((user) => {

                    if (!user) {
                        this.sendResponseError(res, ['Error.UserNotFound'], 0, 403);
                    } else {

                        if (user.last_name === password) {

                            const token = jwt.sign({
                                    user_id: user.account_id,
                                    username: user.first_name

                                },
                                appSecret, {
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
                    return this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', error], 1, 403);
                });
            }
        }
    }

    AddEditAccount(req, res, next) {
        let _this = this;
        let newAccount = req.body;
        let {domain, account_id} = newAccount;
        if (!!!newAccount
            || !!!newAccount.user
            || !!!newAccount.role_crm_id) {
            return _this.sendResponseError(res, 'Error.InvalidData');
        }
        let {accountcode} = newAccount.user.sip_device;

        let sip_device = JSON.parse(JSON.stringify(newAccount.user.sip_device));
        let {username, password, options, status, enabled, subscriber_id} = sip_device;
        this.isUniqueDomain(domain, account_id)
            .then(isUniqueDomain => {
                if (isUniqueDomain) {
                    if (newAccount.account_id) {
                        let data_update = {
                            username,
                            password,
                            domain,
                            options,
                            accountcode,
                            status,
                            enabled,
                            subscriber_id
                        }
                        axios
                            .put(`${base_url_cc_kam}api/v1/agents/${sip_device.uuid}`,
                                data_update,
                                call_center_authorization)
                            .then((resp) => {
                                let uuid = resp.data.agent.uuid || null;
                                let username = resp.data.agent.username || null;
                                newAccount.user.sip_device.uuid = uuid;
                                newAccount.user.sip_device.username = username;
                                this.db['accounts'].update(
                                    newAccount,
                                    {
                                        where: {
                                            account_id: newAccount.account_id
                                        },
                                        returning: true,
                                        plain: true
                                    }).then(account => {
                                    _usersbo.saveUserFunction(newAccount.user, {where: {user_id: account.user_id}})
                                        .then(user => {
                                            res.send({
                                                status: 200,
                                                message: 'success',
                                                success: true,
                                                data: user
                                            })
                                        })
                                        .catch(err => {
                                            return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
                                        })
                                }).catch(err => {
                                    return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
                                })
                            }).catch(err => {
                                return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
                        })
                    } else {
                        let dataAccount = {
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
                            .post(`${base_url_cc_kam}api/v1/agents`, dataAccount, call_center_authorization)
                            .then((resp) => {
                                let uuid = resp.data.result.agent.uuid || null;
                                let username = resp.data.result.agent.username || null;
                                newAccount.user.sip_device.uuid = uuid;
                                newAccount.user.sip_device.username = username;
                                let modalObj = this.db['accounts'].build(newAccount);
                                modalObj.save().then(new_account => {
                                    if (new_account) {
                                        newAccount.user.account_id = new_account.account_id;
                                        _usersbo.saveUserFunction(newAccount.user).then(new_user => {
                                            this.db['accounts'].update({
                                                user_id: new_user.user_id
                                            }, {
                                                where: {
                                                    account_id: new_account.account_id
                                                },
                                                returning: true,
                                                plain: true
                                            }).then(update_account => {
                                                res.send({
                                                    status: 200,
                                                    message: 'success',
                                                    success: true,
                                                    data: new_user
                                                })
                                            })
                                                .catch(err => {
                                                    return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
                                                })
                                        })
                                            .catch(err => {
                                                return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
                                            })
                                    } else {
                                        return _this.sendResponseError(res, ['Error.AnErrorHasOccurredSaveAccount'], 1, 403);
                                    }

                                }).catch(err => {
                                    return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
                                })
                            }).catch(err => {
                            return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
                        })
                    }
                } else {
                    res.send({
                        status: 200,
                        success: false,
                        message: 'This domain is already taken'
                    })
                }
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Cannot check the domain unicity', err], 1, 403);
            })
    }

    deleteAgents(agents) {
        let index = 0;
        return new Promise((resolve, reject) => {
            if (agents && agents.length !== 0) {
                agents.forEach(agent => {
                    let uuid = agent.sip_device.uuid;
                    let agent_id = agent.user_id;
                    _agentsbo.deleteAgentFunc(uuid, agent_id)
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
                })
            } else {
                resolve(true);
            }
        })
    }

    deleteUsers(users) {
        let index = 0;
        return new Promise((resolve, reject) => {
            if (users && users.length !== 0) {
                users.forEach(user => {
                    this.db['users'].update({active: 'N'}, {where: {user_id: user.user_id}})
                        .then(resp => {
                            if (index < users.length - 1) {
                                index++;
                            } else {
                                resolve(true);
                            }
                        })
                        .catch(err => {
                            reject(err);
                        })
                })
            } else {
                resolve(true);
            }
        })
    }

    deleteCampaign(campaigns) {
        let index = 0;
        return new Promise((resolve, reject) => {
            if (campaigns && campaigns.length !== 0) {
                campaigns.forEach(campaign => {
                    let uuid = campaign.params.queue.uuid;
                    let campaign_id = campaign.campaign_id;
                    _campaignsbo.deleteCampaignFunc(uuid, campaign_id)
                        .then(() => {
                            if (index < campaigns.length - 1) {
                                index++;
                            } else {
                                resolve(true);
                            }
                        })
                        .catch(err => {
                            reject(err);
                        })
                })
            } else {
                resolve(true);
            }
        })
    }

    deleteTrunks(trunks) {
        let index = 0;
        return new Promise((resolve, reject) => {
            if (trunks && trunks.length !== 0) {
                trunks.forEach(trunk => {
                    let uuid = trunk.gateways.uuid;
                    let trunk_id = trunk.campaign_id;
                    _trunksbo.deleteTrunkFunc(uuid, trunk_id)
                        .then(() => {
                            if (index < trunks.length - 1) {
                                index++;
                            } else {
                                resolve(true);
                            }
                        })
                        .catch(err => {
                            reject(err);
                        })
                })
            } else {
                resolve(true);
            }
        })
    }

    deleteAllRelativeTrunks(account_id) {
        return new Promise((resolve, reject) => {
            this.db['truncks'].findAll({
                where: {
                    account_id: account_id,
                    active: 'Y'
                }
            })
                .then((trunks) => {
                    this.deleteTrunks(trunks)
                        .then(resp => {
                            resolve(true);
                        })
                        .catch(err => {
                            reject(err);
                        })
                })
                .catch(err => {
                    reject(err);
                })
        })
    }

    deleteAllRelativeCampaigns(account_id) {
        return new Promise((resolve, reject) => {
            this.db['campaigns'].findAll({
                where: {
                    account_id: account_id,
                    active: 'Y'
                }
            })
                .then((campaigns) => {
                    this.deleteCampaign(campaigns)
                        .then(resp => {
                            resolve(true);
                        })
                        .catch(err => {
                            reject(err);
                        })
                })
                .catch(err => {
                    reject(err);
                })
        })
    }

    deleteAllRelativeAgents(account_id) {
        return new Promise((resolve, reject) => {
            this.db['users'].findAll({
                where: {
                    account_id: account_id,
                    role_crm_id: 3,
                    active: 'Y'
                }
            })
                .then(agents => {
                    this.deleteAgents(agents)
                        .then(() => {
                            resolve(true)
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

    deleteAllRelativeUsers(account_id) {
        return new Promise((resolve, reject) => {
            this.db['users'].findAll({
                where: {
                    account_id: account_id,
                    active: 'Y',
                    [Op.or]: [{role_crm_id: 1}, {role_crm_id: 4}, {role_crm_id: 5}],
                }
            })
                .then(users => {
                    this.deleteUsers(users)
                        .then(() => {
                            resolve(true)
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

    deleteAccount(req, res, next) {
        let _this = this;
        let account_id = req.body.account_id;
        this.deleteAllRelativeTrunks(account_id)
            .then(() => {
                this.deleteAllRelativeAgents(account_id)
                    .then(() => {
                        this.deleteAllRelativeUsers(account_id)
                            .then(() => {
                                this.deleteAllRelativeCampaigns(account_id)
                                    .then(() => {
                                        this.db['accounts']
                                            .update({active: 'N'}, {where: {account_id: account_id}})
                                            .then(() => {
                                                res.send({
                                                    status: 200,
                                                    message: 'account deleted with success'
                                                })
                                            })
                                            .catch(err => {
                                                return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
                                            })
                                    })
                                    .catch(err => {
                                        return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
                                    })
                            })
                            .catch(err => {
                                return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
                            })
                    })
                    .catch(err => {
                        return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
                    })
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
            })
    }

    isUniqueDomain(domain, account_id) {
        return new Promise((resolve, reject) => {
            if (domain) {
                this.db['accounts'].findAll({
                    where: {
                        active: 'Y',
                        domain: {
                            [Sequelize.Op.iLike]: domain
                        }
                    }
                })
                    .then(accounts => {
                        if (accounts && accounts.length !== 0) {
                            if (domain === accounts[0].domain && parseInt(account_id) === accounts[0].account_id) {
                                resolve(true);
                            } else {
                                resolve(false);
                            }
                        } else {
                            resolve(true);
                        }
                    })
                    .catch(err => {
                        reject(err);
                    })
            } else {
                resolve(true);
            }
        })
    }

}

module.exports = accounts;
