const {baseModelbo} = require('./basebo');
let db = require('../models');
const jwt = require('jsonwebtoken');
const salt = require("../config/config.json")["salt"]
const bcrypt = require("bcrypt");
const {Sequelize} = require("sequelize");
const moment = require("moment");
const {default: axios} = require("axios");
const appSocket = new (require('../providers/AppSocket'))();
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];
const call_center_token = require(__dirname + '/../config/config.json')[env]["call_center_token"];
const base_url_cc_kam = require(__dirname + '/../config/config.json')[env]["base_url_cc_kam"];
const call_center_authorization = {
    headers: {Authorization: call_center_token}
};
const helpers = require('../helpers/helpers')
const Op = require("sequelize/lib/operators");

class users extends baseModelbo {
    constructor() {
        super('users', 'user_id');
        this.baseModal = 'users';
        this.primaryKey = 'user_id'
    }

    signIn(req, res, next) {
        let {username, password, web_domain, base_url, url} = req.body;
        let _this = this;
        if ((!!!username || !!!password)) {
            return res.send({
                data: null,
                status: 403,
                success: false,
                message: 'All fields are required !'
            })
        }
        let webDomain = web_domain === 'localhost' ? 'admin.skycrm360.io' : web_domain
        this.db['accounts'].findOne({
            where: {
                web_domain: webDomain,
                active: 'Y',
                status: 'Y'
            }
        }).then((account_domain) => {
            if (!!!account_domain) {
                return res.send({
                    data: null,
                    status: 403,
                    success: false,
                    message: "web domain not found"
                })
            }
            _this.getUserRoleInfo(username, account_domain.account_id).then(data_user_info => {
                let PromiseDataUser = new Promise((resolve, reject) => {
                    if (data_user_info && data_user_info.roles_crm.value === 'superadmin') {
                        if (url !== base_url) {
                            return resolve({
                                success: false,
                                message: "invalid web domain"
                            })
                        }
                        this.db['users'].findOne({
                            include: [{
                                model: db.roles_crms,
                            },
                                {
                                    model: db.accounts,
                                },
                                {
                                    model: db.roles,
                                }
                            ],
                            where: {
                                username: username,
                                active: 'Y',
                                status: 'Y'
                            }
                        }).then((user) => {
                            if (!!!user) {
                                return resolve({
                                    success: false,
                                    message: "username not found"
                                })
                            }
                            return resolve({
                                success: true,
                                data: user
                            })

                        }).catch(() => {
                            return this.sendResponseError(res, ['Error.AnErrorHasOccurredUser'], 1, 403);
                        });
                    } else {
                        this.db['users'].findOne({
                            include: [{
                                model: db.roles_crms,
                            },
                                {
                                    model: db.accounts,
                                },
                                {
                                    model: db.roles,
                                }
                            ],
                            where: {
                                username: username,
                                active: 'Y',
                                status: 'Y',
                                account_id: account_domain.account_id
                            }
                        }).then((user) => {
                            if (!!!user) {
                                return resolve({
                                    success: false,
                                    message: "username not found by this web domain"
                                })
                            }
                            return resolve({
                                success: true,
                                data: user
                            })
                        })
                    }
                })
                Promise.all([PromiseDataUser]).then(data_user => {
                    if (!data_user[0].success) {
                        return res.send({
                            data: null,
                            status: 403,
                            success: false,
                            message: data_user[0].message
                        })
                    }
                    let user = data_user[0].data
                    if (!user) {
                        return res.send({
                            data: null,
                            status: 403,
                            success: false,
                            message: "user not found"
                        })
                    } else {
                        let user_info = user.toJSON();
                        if ((user_info && user_info.roles_crm && user_info.roles_crm.value === 'agent')) {
                            if (user_info.current_session_token && user_info.sip_device.status !== 'logged-out') {
                                return res.send({
                                    data: null,
                                    status: 403,
                                    success: false,
                                    message: 'Agent already connected !'
                                })
                            }
                            this.db['accounts'].findOne({
                                where: {
                                    account_id: user_info.account_id,
                                    active: 'Y',
                                    status: 'Y'
                                }
                            }).then((account_data) => {
                                if (!account_data) {
                                    return res.send({
                                        data: null,
                                        status: 403,
                                        success: false,
                                        message: 'Account not found !'
                                    })

                                } else if (user.password_hash && password && user.verifyPassword(password)) {
                                    if (user.password_hash && password) {
                                        this.db['has_permissions'].findAll({
                                            include: [{
                                                model: db.permissions_crms,
                                            }],
                                            where: {
                                                roles_crm_id: user.role_crm_id,
                                                active: 'Y'
                                            }
                                        }).then(permissions => {
                                            this.getPermissionsValues(permissions, user).then(data_perm => {
                                                this.db['accounts'].findOne({
                                                    include: [{model: db.domains}],
                                                    where: {account_id: user.account_id}
                                                })
                                                    .then(account => {
                                                        let accountcode = account.account_code;
                                                        let {
                                                            sip_device,
                                                            first_name,
                                                            last_name,
                                                            user_id,
                                                            campaign_id
                                                        } = user;

                                                        if (user_info.roles_crm.value === 'agent') {
                                                            let data_agent = {
                                                                user_id: user_id,
                                                                first_name: first_name,
                                                                last_name: last_name,
                                                                uuid: sip_device.uuid,
                                                                crmStatus: user.params.status,
                                                                telcoStatus: sip_device.status,
                                                                timerStart: sip_device.updated_at,
                                                                campaign_id: campaign_id
                                                            };
                                                            appSocket.emit('agent_connection', data_agent);
                                                        }
                                                        const token = jwt.sign({
                                                            user_id: user.user_id,
                                                            username: user.username,
                                                        }, config.secret, {
                                                            expiresIn: '8600m'
                                                        });
                                                        this.db['users'].update({current_session_token: token}, {where: {user_id: user.user_id}})
                                                            .then(() => {
                                                                res.send({
                                                                    message: 'Success',
                                                                    user: user.toJSON(),
                                                                    permissions: data_perm.permissions_values || [],
                                                                    permissions_route: data_perm.permissions_description || [],
                                                                    success: true,
                                                                    token: token,
                                                                    result: 1,
                                                                    accountcode: accountcode,
                                                                    domain_name: account.domain && account.domain.domain_name ? account.domain.domain_name : null
                                                                });
                                                            }).catch((error) => {
                                                            return this.sendResponseError(res, ['Error.AnErrorHasOccurredUser'], 1, 403);
                                                        });
                                                    }).catch((error) => {
                                                    return this.sendResponseError(res, ['Error.AnErrorHasOccurredUser'], 1, 403);
                                                });
                                            })
                                        })
                                    } else {
                                        return res.send({
                                            data: null,
                                            status: 403,
                                            success: false,
                                            message: 'Incorrect password'
                                        })
                                    }
                                } else {
                                    return res.send({
                                        data: null,
                                        status: 403,
                                        success: false,
                                        message: 'Incorrect password'
                                    })
                                }
                            }).catch((error) => {
                                return res.send({
                                    data: null,
                                    status: 403,
                                    success: false,
                                    message: 'Problem finding Account'
                                })
                            });
                        } else if (user.password_hash && password && user.verifyPassword(password)) {
                            if (user.password_hash && password) {
                                this.db['has_permissions'].findAll({
                                    include: [{
                                        model: db.permissions_crms,
                                    }],
                                    where: {
                                        roles_crm_id: user.role_id !== null ? user.account.role_crm_id : user.role_crm_id,
                                        active: 'Y'
                                    }
                                }).then(permissions => {
                                    this.getPermissionsValues(permissions, user).then(data_perm => {
                                        this.db['accounts'].findOne({
                                            include: [{
                                                model: db.domains
                                            }],
                                            where: {
                                                account_id: user.account_id,
                                                active: 'Y',
                                                status: 'Y'
                                            }
                                        })
                                            .then(account => {
                                                if (!account) {
                                                    res.send({
                                                        data: null,
                                                        status: 403,
                                                        success: false,
                                                        message: 'Account not found !'
                                                    })
                                                    return
                                                }
                                                let accountcode = account.account_code;
                                                if (user_info && user_info.roles_crm && (user_info.roles_crm.value === 'admin' || user_info.roles_crm.value === 'superadmin' || user_info.roles_crm.value === 'user')) {
                                                    if (!!!user.role_id && user_info.roles_crm.value === 'user') {
                                                        return res.send({
                                                            data: null,
                                                            status: 403,
                                                            success: false,
                                                            message: 'User without role'
                                                        })
                                                    }
                                                    const token = jwt.sign({
                                                        user_id: user.user_id,
                                                        username: user.username,
                                                    }, config.secret, {
                                                        expiresIn: '8600m'
                                                    });
                                                    this.db['users'].update({current_session_token: token}, {where: {user_id: user.user_id}})
                                                        .then(() => {
                                                            let permissions_user = [];
                                                            let permissions = [];
                                                            if (user.role_id) {
                                                                let default_permissions = [
                                                                    {
                                                                        "lookups": [
                                                                            {
                                                                                "key": "add"
                                                                            },
                                                                            {
                                                                                "key": "edit"
                                                                            },
                                                                            {
                                                                                "key": "delete"
                                                                            },
                                                                            {
                                                                                "key": "list"
                                                                            }
                                                                        ],
                                                                        "permission_route": "user-settings"
                                                                    },
                                                                    {
                                                                        "lookups": [
                                                                            {
                                                                                "key": "add"
                                                                            },
                                                                            {
                                                                                "key": "edit"
                                                                            },
                                                                            {
                                                                                "key": "delete"
                                                                            },
                                                                            {
                                                                                "key": "list"
                                                                            }
                                                                        ],
                                                                        "permission_route": "home"
                                                                    }
                                                                ]
                                                                let list_permissions = user.role.permission;
                                                                permissions_user = list_permissions.concat(default_permissions)
                                                                permissions = data_perm.user_has_role_permission
                                                                //permissions = data_perm.user_has_role_permission.concat('home')
                                                            } else {
                                                                permissions = data_perm.permissions_values || []
                                                            }
                                                            res.send({
                                                                message: 'Success',
                                                                user: user.toJSON(),
                                                                permissions: permissions,
                                                                permissions_route: data_perm.permissions_description || [],
                                                                success: true,
                                                                token: token,
                                                                result: 1,
                                                                accountcode: accountcode,
                                                                list_permission: permissions_user,
                                                                domain_name: account.domain && account.domain.domain_name ? account.domain.domain_name : null
                                                            });
                                                        }).catch((error) => {
                                                        return this.sendResponseError(res, ['Error.AnErrorHasOccurredUser'], 1, 403);
                                                    });
                                                } else {
                                                    return this.sendResponseError(res, ['Error.AnErrorHasOccurredUser'], 1, 403);
                                                }

                                            }).catch((error) => {
                                            return this.sendResponseError(res, ['Error.AnErrorHasOccurredUser'], 1, 403);
                                        });
                                    })
                                })
                            } else {
                                return res.send({
                                    data: null,
                                    status: 403,
                                    success: false,
                                    message: 'Incorrect password'
                                })
                            }
                        } else {
                            return res.send({
                                data: null,
                                status: 403,
                                success: false,
                                message: 'Incorrect password'
                            })
                        }
                    }
                })
            })
        }).catch(() => {
            return this.sendResponseError(res, ['Error.AnErrorHasOccurredFindAccount'], 1, 403);
        });
    }

    getUserRoleInfo(username, account_id) {
        return new Promise((resolve, reject) => {
            this.db['users'].findOne({
                include: [{
                    model: db.roles_crms,
                }
                ],
                where: {
                    account_id: account_id,
                    username: username,
                    active: 'Y',
                    status: 'Y',
                }
            }).then((user) => {
                resolve(user)
            }).catch(err => {
                reject(err)
            })
        })
    }

    switchToNewAccount(req, res, next) {
        let _this = this;
        let user_id = req.body.user_id;
        if (!!!user_id) {
            return _this.sendResponseError(res, ['Error.RequestDataInvalid'], 0, 403);
        }
        this.db['users'].findOne({
            include: [{
                model: db.roles_crms,
            },
                {
                    model: db.accounts,
                },
                {
                    model: db.roles,
                }],
            where: {
                user_id: user_id,
                active: 'Y'
            }
        }).then((user) => {

            if (!user) {
                return _this.sendResponseError(res, ['Error.UserNotFound'], 0, 403);
            }
            if (user.status === 'N') {
                return res.send({
                    success: false,
                    status: 403,
                    message: 'enable-account'
                })
            }
            this.db['has_permissions'].findAll({
                include: [{
                    model: db.permissions_crms,
                }],
                where: {
                    roles_crm_id: user.role_crm_id,
                    active: 'Y'
                }
            }).then(permissions => {
                this.getPermissionsValues(permissions).then(data_perm => {
                    this.db['accounts'].findOne({include: [{model: db.domains}], where: {account_id: user.account_id}})
                        .then(account => {
                            let accountcode = account.account_code;
                            const token = jwt.sign({
                                user_id: user.user_id,
                                username: user.username,
                            }, config.secret, {
                                expiresIn: '8600m'
                            });
                            this.db['users'].update({current_session_token: token}, {where: {user_id: user.user_id}})
                                .then(() => {
                                    res.send({
                                        message: 'Success',
                                        user: user.toJSON(),
                                        permissions: data_perm.permissions_values || [],
                                        permissions_route: data_perm.permissions_description || [],
                                        success: true,
                                        token: token,
                                        result: 1,
                                        accountcode: accountcode,
                                        domain_name: account.domain && account.domain.domain_name ? account.domain.domain_name : null
                                    });
                                }).catch((error) => {
                                return this.sendResponseError(res, ['Error.AnErrorHasOccurredUpdateTokenUser'], 1, 403);
                            });
                        }).catch((error) => {
                        return this.sendResponseError(res, ['Error.AnErrorHasOccurredUser'], 1, 403);
                    });

                })
            })
        }).catch((error) => {
            return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', error], 1, 403);
        });
    }

    isUniqueUsername(username, user_id, account_id = null) {
        let _this = this;
        return new Promise((resolve, reject) => {
            if (!!!username) {
                resolve(false);
            }
            let whereQuery = {
                username: {
                    [Sequelize.Op.iLike]: username
                },
                active: 'Y'
            }
            if (account_id) {
                whereQuery.account_id = account_id;
            }
            this.db['users'].findAll({
                where: whereQuery
            })
                .then(data => {
                    if (data && data.length !== 0) {
                        let check;
                        if (!!!account_id) {
                            check = (username === data[0].username && user_id === data[0].user_id);
                        } else {
                            check = (username === data[0].username && user_id === data[0].user_id && account_id === data[0].account_id)
                        }
                        if (check) {
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
        })
    }

    generateUniqueUsernameFunction() {
        return new Promise((resolve, reject) => {
            let condition = false;
            do {
                helpers.generateUsername()
                    .then(generatedUsername => {
                        this.isUniqueUsername(generatedUsername, 0)
                            .then(isUnique => {
                                condition = isUnique;
                                if (condition) {
                                    let dataAgent = {};
                                    dataAgent.first_name = 'agent_'.concat(Math.floor(Math.random() * (999 - 100 + 1) + 100));
                                    dataAgent.username = generatedUsername;
                                    resolve(dataAgent)
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

    generatedUniqueUsername(req, res, next) {
        let _this = this;
        this.generateUniqueUsernameFunction()
            .then(username => {
                res.send({
                    username: username
                })
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
            })
    }

    getPermissionsValues = (permissions, user) => {
        return new Promise((resolve, reject) => {
            if (user && user.role_id !== null) {
                this.PermissionUser(user).then(permissions_lockups => {
                    if (permissions && permissions.length !== 0) {
                        let permissions_values = [];
                        let permissions_description = [];
                        let index = 0;
                        permissions.forEach(item_perm => {
                            permissions_values.push(item_perm.permissions_crm.value);
                            let obj = {
                                value: item_perm.permissions_crm.value,
                                description: item_perm.permissions_crm.description,
                                is_updatable: item_perm.permissions_crm.is_updatable
                            }
                            permissions_description.push(obj)
                            if (index < permissions.length - 1) {
                                index++
                            } else {
                                permissions_lockups.push('user-settings')
                                resolve({
                                    permissions_values: permissions_values,
                                    permissions_description: permissions_description,
                                    user_has_role_permission: permissions_lockups
                                });
                            }
                        })
                    } else {
                        resolve({
                            permissions_values: [],
                            permissions_description: [],
                            user_has_role_permission: []
                        });
                    }
                })
            } else {
                if (permissions && permissions.length !== 0) {
                    let permissions_values = [];
                    let permissions_description = [];
                    let index = 0;
                    permissions.forEach(item_perm => {
                        permissions_values.push(item_perm.permissions_crm.value);
                        let obj = {
                            value: item_perm.permissions_crm.value,
                            description: item_perm.permissions_crm.description,
                            is_updatable: item_perm.permissions_crm.is_updatable
                        }
                        permissions_description.push(obj)
                        if (index < permissions.length - 1) {
                            index++
                        } else {
                            resolve({
                                permissions_values: permissions_values,
                                permissions_description: permissions_description
                            });
                        }
                    })
                } else {
                    resolve({
                        permissions_values: [],
                        permissions_description: [],
                        user_has_role_permission: []
                    });

                }
            }

        })
    }

    generateHash(password, salt) {
        return new Promise((resolve, reject) => {
            bcrypt.hash(password, salt, function (err, hash) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        salt: salt,
                        password: password,
                        hash: hash
                    });
                }
            });
        });
    }

    saveCredentials(newAccount) {
        return new Promise((resolve, reject) => {
            this.generateHash(newAccount.password_hash, salt)
                .then(hashedObj => {
                    newAccount.password_hash = hashedObj.hash;
                    let template = {
                        to: newAccount.email,
                        subject: `CRM OXILOG - Login Credentials`,
                        body: `Hello, Mr/Mrs ${newAccount.first_name} ${newAccount.last_name}, \n Here are your login credentials : 
                \n Username : ${newAccount.username} 
                \n Password : ${hashedObj.password}`
                    }
                    let email = {
                        user_id: newAccount.user_id,
                        category: 'credentials',
                        last_password: hashedObj.password,
                        template
                    }
                    let modalObj = this.db['emails'].build(email)
                    modalObj.save()
                        .then((email_item) => {
                            resolve({newAccount: newAccount, email_item: email_item})
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

    updateCredentials(newAccount) {
        return new Promise((resolve, reject) => {
            if (newAccount.password_hash) {

                this.generateHash(newAccount.password_hash, salt)
                    .then(hashedObj => {
                        newAccount.password_hash = hashedObj.hash;
                        let template = {
                            to: newAccount.email,
                            subject: `CRM OXILOG - Login Credentials`,
                            body: `Hello, Mr/Mrs ${newAccount.first_name} ${newAccount.last_name}, 
                            \n Here are your login credentials : 
                            \n Username : ${newAccount.username} 
                            \n Password : ${hashedObj.password}`
                        }

                        let email = {
                            user_id: newAccount.user_id,
                            category: 'credentials',
                            last_password: hashedObj.password,
                            template
                        }
                        this.db['emails'].update(email, {where: {user_id: newAccount.user_id}})
                            .then(() => {
                                resolve(newAccount)
                            })
                            .catch(err => {
                                reject(err)
                            })
                    })
                    .catch(err => {
                        reject(err)
                    })
            } else {
                this.db['emails'].findOne({where: {user_id: newAccount.user_id}})
                    .then(email_item => {
                        let template = {
                            to: newAccount.email,
                            subject: `CRM OXILOG - Login Credentials`,
                            body: `Hello, Mr/Mrs ${newAccount.first_name} ${newAccount.last_name}, 
                            \n Here are your login credentials : 
                            \n Username : ${newAccount.username} 
                            \n Password : ${email_item.last_password}`
                        }

                        let email = {
                            user_id: newAccount.user_id,
                            category: 'credentials',
                            last_password: email_item.last_password,
                            template
                        }
                        this.db['emails'].update(email, {where: {user_id: newAccount.user_id}})
                            .then(() => {
                                resolve(newAccount)
                            })
                            .catch(err => {
                                reject(err)
                            })
                    })
                    .catch(err => {
                        reject(err)
                    })
            }

        })
    }

    saveUser(req, res, next) {
        let _this = this;
        let newAccount = req.body.new_account;
        let user_id = newAccount && newAccount.user_id ? newAccount.user_id : 0;
        let is_agent = newAccount.is_agent
        let {accountcode} = newAccount.sip_device;
        let sip_device = JSON.parse(JSON.stringify(newAccount.sip_device));
        let {username, password, domain, options, status, enabled, subscriber_id} = sip_device;
        this.isUniqueUsername(newAccount.username, user_id)
            .then(isUnique => {
                if (isUnique) {
                    if (newAccount) {
                        if (user_id) {
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
                                    newAccount.sip_device.uuid = uuid;
                                    newAccount.sip_device.username = username;

                                    this.saveUserFunction(newAccount)
                                        .then((user) => {
                                            res.send({
                                                message: 'success',
                                                data: user,
                                                success: true
                                            })
                                        })
                                        .catch(err => {
                                            return _this.sendResponseError(res, ['Error.AnErrorHasOccurredSaveUser', err], 1, 403);
                                        })

                                }).catch(err => {
                                return _this.sendResponseError(res, ['Error.AnErrorHasOccurredSaveUser', err], 1, 403);
                            })
                        } else {
                            this.db['users'].findOne({
                                where: {active: 'Y'},
                                order: [['user_id', 'DESC']]
                            })
                                .then(lastAgent => {
                                    let increment = 1;
                                    let lastAgentSip_device = lastAgent && lastAgent.sip_device ? lastAgent.sip_device : sip_device
                                    let lastAgentKamailioUsername = lastAgent && lastAgentSip_device.username ? lastAgentSip_device.username : newAccount.username;
                                    let username = (parseInt(lastAgentKamailioUsername) + increment).toString();
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
                                            let uuid = resp.data.result.agent.uuid || null;
                                            let username = resp.data.result.agent.username || null;
                                            newAccount.sip_device.uuid = uuid;
                                            newAccount.sip_device.username = username;
                                            this.saveUserFunction(newAccount)
                                                .then((user) => {
                                                    res.send({
                                                        message: 'success',
                                                        data: user,
                                                        success: true
                                                    })
                                                })
                                                .catch(err => {
                                                    return _this.sendResponseError(res, ['Error.AnErrorHasOccurredSaveUser', err], 1, 403);
                                                })
                                        })
                                }).catch(err => {
                                return _this.sendResponseError(res, ['Error.AnErrorHasOccurredSaveUser', err], 1, 403);
                            })
                        }
                    }
                } else {
                    res.send({
                        status: 200,
                        success: false,
                        message: 'This username is already exist'
                    })
                }
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccurredSaveUser', err], 1, 403);
            })
    }

    updateAcc(req, res, next) {
        let {first_name, last_name, email, password_hash, user_id} = req.body;
        this.db['users'].findOne({where: {user_id: user_id, active: 'Y'}}).then(user => {
            if (password_hash) {
                let UserPass = {
                    user_id: user.user_id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    password_hash
                }
                this.updateCredentials(UserPass).then(UpdatedAcc => {
                    UpdatedAcc.updated_at = moment(new Date());
                    let params = user.params;
                    params.pass_web = password_hash;
                    UpdatedAcc.params = params;
                    this.db['users'].update(UpdatedAcc, {where: {user_id: user.user_id}}).then(() => {
                        res.send({
                            message: 'success',
                            status: 200
                        })
                    })
                }).catch(err => {
                    return this.sendResponseError(res, ['Error.CannotUpdatePasswordUser'], 1, 403)
                });
            } else {
                let User = {
                    first_name,
                    last_name,
                    email,
                    updated_at: moment(new Date())
                }
                this.db['users'].update(User, {where: {user_id: user_id}}).then(() => {
                    this.db['accounts'].update(User, {where: {account_id: user.account_id}}).then(() => {
                        res.send({
                            message: 'success',
                            status: 200
                        })
                    })
                }).catch(err => {
                    this.sendResponseError(res, ['Error.CannotUpdateUser'], 1, 403)
                })
            }
        })

    }

    saveUserFunction(user) {
        return new Promise((resolve, reject) => {
            if (user.user_id) {
                this.updateCredentials(user)
                    .then(newAccount => {
                        newAccount['current_session_token'] = null;
                        newAccount.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");
                        db['users'].update(newAccount, {where: {user_id: newAccount.user_id}})
                            .then(user => {
                                appSocket.emit('reload.Permission', {user_id: newAccount.user_id});
                                resolve(user)
                            })
                            .catch(err => {
                                reject(err)
                            })
                    })
                    .catch(err => {
                        reject(err)
                    })
            } else {
                this.saveCredentials(user)
                    .then(data => {
                        let {newAccount, email_item} = data;
                        newAccount.created_at = moment(new Date());
                        newAccount.updated_at = moment(new Date());
                        let modalObj = this.db['users'].build(newAccount);
                        modalObj.save()
                            .then(user => {
                                this.db['emails'].update({user_id: user.user_id}, {where: {email_id: email_item.email_id}})
                                    .then(() => {
                                        resolve(user)
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
        })
    }

    validPassword(req, res, next) {
        let _this = this;
        let {password_hashed, password_to_validate} = req.body;
        bcrypt.compare(password_to_validate, password_hashed)
            .then(validPassword => {
                res.send({
                    message: 'success',
                    data: validPassword
                })
            })
            .catch((error) => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccurred', error], 1, 403);
            });
    }

    getUserByToken(req, res, next) {

        jwt.verify(req.headers.authorization.replace('Bearer ', ''), config.secret, (err, decodedToken) => {
            if (err) {
                res.send(err);
            } else {
                this.db['users'].findOne({
                    where: {
                        user_id: decodedToken.user_id
                    }
                }).then(user => {
                    res.send(user.dataValues);

                });
            }
        });

    }


    verifyToken(req, res, next) {
        let _this = this;
        let {token, user_id} = req.body;
        if (!!!token || !!!user_id) {
            return res.send({
                success: false,
                data: [],
                message: 'Invalid token',
            });
        }
        jwt.verify(token, config.secret, (err, data) => {
            if (!err) {
                this.db['users'].findOne({
                    where: {
                        user_id: user_id,
                        active: 'Y',
                        status: 'Y',
                        current_session_token: {[Op.not]: null}
                    }, include: [db.roles_crms]
                })
                    .then((result) => {
                        if (result && Object.keys(result).length > 0) {
                            let user = result.toJSON();
                            if ((user.roles_crm.value === 'agent' && user.current_session_token === token) || user.roles_crm.value !== 'agent') {
                                res.send({
                                    success: true,
                                    data: data,
                                    message: 'Valid token',
                                });
                            } else {
                                res.send({
                                    success: false,
                                    data: [],
                                    message: 'Invalid token',
                                });
                            }
                        } else {
                            res.send({
                                success: false,
                                data: [],
                                message: 'User Not Found',
                            });
                        }
                    }).catch(err => {
                    return _this.sendResponseError(res, ['Error.AnErrorHasOccurredGetUser', err], 1, 403);
                })
            } else {
                res.send({
                    success: false,
                    data: [],
                    message: 'Invalid token',
                });
            }

        });
    }


    verifyTokenParam(token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, config.secret, (err, data) => {
                if (data) {
                    resolve(true);
                } else {
                    resolve(false)
                }
            });
        })

    }


    getSalesByAgent(req, res, next) {
        let _this = this;
        let {user_id} = req.body;
        this.db['users'].findOne({where: {user_id: user_id}})
            .then(agent => {
                let sales_params = agent.params.sales;
                if (sales_params && sales_params.length !== 0) {
                    this.db['users'].findAll({where: {active: 'Y', user_id: sales_params}})
                        .then(sales => {
                            res.send({
                                status: 200,
                                message: 'success',
                                data: sales
                            })
                        })
                        .catch(err => {
                            return _this.sendResponseError(res, ['Error.AnErrorHasOccurredGetSales', err], 1, 403);
                        })
                } else {
                    res.send({
                        status: 200,
                        message: 'success',
                        data: []
                    })
                }
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccurredGetSales', err], 1, 403);
            })
    }

    deleteSalesRepresentative(req, res, next) {
        let _this = this;
        let {user_id} = req.body;
        this.db['users'].update({active: 'N'}, {where: {user_id: user_id}})
            .then(() => {
                this.db['meetings'].update({active: 'N'}, {where: {sales_id: user_id}})
                    .then(() => {
                        res.send({
                            status: 200,
                            message: 'deleted with success',
                        })
                    })
                    .catch(err => {
                        return _this.sendResponseError(res, ['Error.AnErrorHasOccurredDeleteUser', err], 1, 403);
                    })
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccurredDeleteUser', err], 1, 403);
            })
    }

    updateParamsAgent(agents, sales_id, isAssigned) {
        let index = 0;
        return new Promise((resolve, reject) => {
            if (agents && agents.length !== 0) {
                agents.forEach(agent => {
                    let updated_at = moment(new Date());
                    let sales_params = agent.params.sales ?
                        JSON.parse(JSON.stringify(agent.params.sales)) : [];
                    let params = JSON.parse(JSON.stringify(agent.params));
                    if (isAssigned) {
                        if (!sales_params.includes(sales_id)) {
                            params.sales = [...sales_params, sales_id];
                        }
                    } else {
                        params.sales = (sales_params && sales_params.length !== 0) ?
                            sales_params.filter(el => el !== sales_id) : [];
                    }
                    this.db['users'].update({
                        params: params,
                        updated_at: updated_at
                    }, {where: {user_id: agent.user_id}})
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

    deleteMeetingsBySalesAgents(user_id, notAssignedAgents) {
        return new Promise((resolve, reject) => {
            if (notAssignedAgents && notAssignedAgents.length !== 0) {
                this.db['meetings'].update({active: 'N'}, {
                    where: {
                        agent_id: notAssignedAgents.map(el => el.user_id),
                        sales_id: user_id
                    }
                })
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

    assignAgentsToSales(req, res, next) {
        let _this = this;
        //user_id here is the id of the salesman
        let {user_id, assignedAgents, notAssignedAgents, params} = req.body;
        this.db['users'].update({params: params}, {where: {user_id: user_id}})
            .then(() => {
                this.updateParamsAgent(assignedAgents, user_id, true)
                    .then(() => {
                        this.updateParamsAgent(notAssignedAgents, user_id, false)
                            .then(() => {
                                this.deleteMeetingsBySalesAgents(user_id, notAssignedAgents)
                                    .then(() => {
                                        res.send({
                                            status: 200,
                                            message: 'success'
                                        })
                                    })
                                    .catch(err => {
                                        return _this.sendResponseError(res, ['Error.AnErrorAssignAgents', err], 1, 403);
                                    })
                            })
                            .catch(err => {
                                return _this.sendResponseError(res, ['Error.AnErrorAssignAgents', err], 1, 403);
                            })
                    })
                    .catch(err => {
                        return _this.sendResponseError(res, ['Error.AnErrorAssignAgents', err], 1, 403);
                    })
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Error.AnErrorAssignAgents', err], 1, 403);
            })
    }

    getDataAgent(req, res, next) {
        let _this = this;
        let {user_id} = req.body;
        this.db['users'].findOne({where: {user_id: user_id, active: 'Y'}})
            .then(user => {
                let campaign_id = user.campaign_id;
                if (!!!campaign_id) {
                    return res.send({
                        status: 200,
                        message: 'success',
                        data: {campaign_id, isActiveCampaign: false}
                    })
                }
                this.db['campaigns'].findOne({where: {campaign_id: campaign_id, active: 'Y'}})
                    .then(campaign => {
                        let status = campaign.status;
                        let isActiveCampaign = status === 'Y';
                        res.send({
                            status: 200,
                            message: 'success',
                            data: {campaign_id, isActiveCampaign, script: campaign.script}
                        })
                    })
                    .catch(err => {
                        return _this.sendResponseError(res, ['Error.AnErrorHasOccurredFetchCampaign', err], 1, 403);
                    })
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccurredFetchUser', err], 1, 403);
            })

    }

    cloneSales(req, res, next) {
        let _this = this;
        let {user_id, first_name, last_name, password_hash, email, username, is_agent} = req.body;
        this.db['users'].findOne({where: {user_id: user_id, active: 'Y'}})
            .then(salesToClone => {
                if (salesToClone && salesToClone.user_id) {
                    this.isUniqueUsername(username, 0)
                        .then(() => {
                            let {
                                params,
                                user_type,
                                account_id,
                                role_id,
                                status,
                                isAssigned,
                                campaign_id,
                                role_crm_id
                            } = salesToClone;

                            params.availability.sales_name = `${first_name} ${last_name}`;

                            let clonedSales = {
                                first_name,
                                last_name,
                                username,
                                password_hash,
                                params,
                                user_type,
                                account_id,
                                role_id,
                                status,
                                isAssigned,
                                campaign_id,
                                email,
                                role_crm_id
                            }
                            this.saveUserFunction(clonedSales)
                                .then(cloned_sales => {
                                    let sales_id = cloned_sales.user_id;
                                    let agents_ids = cloned_sales.params.agents;
                                    if (agents_ids && agents_ids.length !== 0) {
                                        this.db['users'].findAll({where: {user_id: agents_ids, active: 'Y'}})
                                            .then(agents => {
                                                this.updateParamsAgent(agents, sales_id, true)
                                                    .then(() => {
                                                        res.send({
                                                            message: 'success',
                                                            data: cloned_sales,
                                                            status: 200
                                                        });
                                                    })
                                                    .catch(err => {
                                                        return _this.sendResponseError(res, ['Error.cannotFetchListUsers', err], 1, 403);
                                                    })
                                            })
                                            .catch(err => {
                                                return _this.sendResponseError(res, ['Error.cannotFetchListUsers', err], 1, 403);
                                            })
                                    } else {
                                        res.send({
                                            message: 'success',
                                            data: cloned_sales,
                                            status: 200
                                        });
                                    }
                                })
                                .catch(err => {
                                    return _this.sendResponseError(res, ['Error.cannotSaveSalesRepresentative', err], 1, 403);
                                })
                        })
                        .catch(err => {
                            return _this.sendResponseError(res, ['Error.OccurredInGenerateUniqueUsername', err], 1, 403);
                        })
                } else {
                    return _this.sendResponseError(res, "The Item to clone does not exist", 1, 403);
                }
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Error.cannotFetchSales', err], 1, 403);
            })
    }

    PermissionUser(user) {
        return new Promise((resolve, reject) => {
            let permission = [];
            let index1 = 0;
            if (user && user.role && user.role.permission && user.role.permission.length !== 0) {
                user.role.permission.forEach(item => {
                    if (item && item.lookups) {
                        let index = item.lookups.findIndex(lookup => lookup.key === "list")
                        if (index !== -1) {
                            permission.push(item.permission_route);
                        }
                    }
                    if (index1 < user.role.permission.length - 1) {
                        index1++
                    } else {
                        resolve(permission)
                    }
                })
            } else {
                resolve(permission)
            }
        })
    }

    _generateUserName(account_id, isAgent = true) {
        return new Promise((resolve, reject) => {
            this.db['roles_crms'].findAll({
                where: {value: isAgent ? ['agent', 'admin'] : 'user', active: 'Y'}
            }).then(role => {
                let SQL = `select * from users where 
                account_id = :account_id 
                and role_crm_id in (:role_crm_id) 
                and active = 'Y' 
                and sip_device->>'username' NOT LIKE '%[^0-9]%' 
                and length(sip_device->>'username') <= 4 
                ORDER BY sip_device->>'username' DESC LIMIT 1`;
                let role_ids = isAgent ? role.map(r => r.id) : role[0].id
                db.sequelize['crm-app'].query(SQL, {
                    type: db.sequelize['crm-app'].QueryTypes.SELECT,
                    replacements: {
                        role_crm_id: role_ids,
                        account_id: account_id
                    }
                }).then((user) => {
                    if (user.length === 0) {
                        resolve(isAgent ? '1000' : '2000')
                    } else {
                        let userName = parseInt(user[0].sip_device.username) + 1
                        resolve(userName.toString())
                    }
                }).catch(err => {
                    reject(err)
                })
            })

        })
    }

    GenerateUserNameFromLastUser(req, res, next) {
        let {account_id, isAgent = true} = req.body;
        if (!!!account_id) {
            return this.sendResponseError(res, ['Error.AccountIdIsRequired'], 1, 403)
        }
        this._generateUserName(account_id, isAgent).then(username => {
            res.json({
                username
            })
        }).catch(err => {
            return this.sendResponseError(res, ['Error.CannotGenerateUsername'], 1, 403)
        })
    }

}

module.exports = users;
