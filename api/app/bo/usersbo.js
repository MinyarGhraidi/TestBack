const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
const {validateEmail} = require("../helpers/helpers");
const config = require('../config/config.json');
const jwt = require('jsonwebtoken');
const salt = require("../config/config.json")["salt"]
const bcrypt = require("bcrypt");
const {appSecret} = require("../helpers/app");
const {Sequelize} = require("sequelize");
const moment = require("moment");

class users extends baseModelbo {
    constructor() {
        super('users', 'user_id');
        this.baseModal = 'users';
        this.primaryKey = 'user_id'
    }

    signIn(req, res, next) {
        if ((!req.body.username || !req.body.password)) {
            return this.sendResponseError(res, ['Error.RequestDataInvalid'], 0, 403);
        } else {
            const {username, password} = req.body;
            if (username && password) {
                this.db['users'].findOne({
                    include: [{
                        model: db.roles_crms,
                    },
                        {
                            model: db.accounts,
                        }
                    ],
                    where: {
                        username: username,
                        active: 'Y',
                        status: 'Y'
                    }
                }).then((user) => {
                    if (!user) {
                        //this.sendResponseError(res, ['Error.UserNotFound'], 0, 403);
                        res.send({
                            message: 'Success',
                        });
                    } else {
                        if (user.password_hash && password) {
                            //if (user.password_hash && user.verifyPassword(password)) {
                            this.db['has_permissions'].findAll({
                                include: [{
                                    model: db.permissions_crms,
                                }],
                                where: {
                                    roles_crm_id: user.role_crm_id,
                                }
                            }).then(permissions => {
                                this.getPermissionsValues(permissions).then(data_perm => {
                                    const token = jwt.sign({
                                        user_id: user.user_id,
                                        username: user.username,
                                    }, config.secret, {
                                        expiresIn: '8600m'
                                    });
                                    res.send({
                                        message: 'Success',
                                        user: user.toJSON(),
                                        permissions: data_perm || [],
                                        success: true,
                                        token: token,
                                        result: 1,
                                    });
                                })
                            })
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

    switchToNewAccount(req, res, next) {
        let _this = this;
        let user_id = req.body.user_id;
        if ((!user_id)) {
            return _this.sendResponseError(res, ['Error.RequestDataInvalid'], 0, 403);
        } else {
            if (user_id) {
                this.db['users'].findOne({
                    include: [{
                        model: db.roles_crms,
                    },
                        {
                            model: db.accounts,
                        }],
                    where: {
                        user_id: user_id,
                        active: 'Y'
                    }
                }).then((user) => {
                    if (!user) {
                        _this.sendResponseError(res, ['Error.UserNotFound'], 0, 403);
                    } else {
                        this.db['has_permissions'].findAll({
                            include: [{
                                model: db.permissions_crms,
                            }],
                            where: {
                                roles_crm_id: user.role_crm_id,
                            }
                        }).then(permissions => {
                            this.getPermissionsValues(permissions).then(data_perm => {
                                const token = jwt.sign({
                                    user_id: user.user_id,
                                    username: user.username,
                                }, config.secret, {
                                    expiresIn: '8600m'
                                });
                                res.send({
                                    message: 'Success',
                                    user: user.toJSON(),
                                    permissions: data_perm || [],
                                    success: true,
                                    token: token,
                                    result: 1,
                                });
                            })
                        })
                    }
                }).catch((error) => {
                    return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', error], 1, 403);
                });
            }
        }
    }

    isUniqueUsername(username, user_id) {
        let _this = this;
        return new Promise((resolve, reject) => {
            this.db['users'].findAll({
                where: {
                    username: {
                        [Sequelize.Op.iLike]: username
                    },
                    active: 'Y'
                }
            })
                .then(data => {
                    if (data && data.length !== 0) {
                        if (username === data[0].username && user_id === data[0].user_id) {
                            resolve(true)
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

    generateUsername() {
        return new Promise((resolve, reject) => {
            var result = '';
            var characters = '0123456789';
            var charactersLength = characters.length;
            for (var i = 0; i < 12; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            resolve(result)
        })
    }

    generateUniqueUsernameFunction() {
        let condition = false;
        return new Promise((resolve, reject) => {
            do {
                this.generateUsername()
                    .then(generatedUsername => {
                        this.isUniqueUsername(generatedUsername, 0)
                            .then(isUnique => {
                                condition = isUnique;
                                if (condition) {
                                    resolve(generatedUsername)
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
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
            })
    }

    getPermissionsValues = (permissions) => {
        return new Promise((resolve, reject) => {
            if (permissions && permissions.length !== 0) {
                let permissions_values = [];
                let index = 0;
                permissions.forEach(item_perm => {
                    permissions_values.push(item_perm.permissions_crm.value);
                    if (index < permissions.length - 1) {
                        index++
                    } else {
                        resolve(permissions_values);
                    }
                })
            } else {
                resolve([]);
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
        let newAccount = req.body;
        let user_id = newAccount.user_id ? newAccount.user_id : 0;
        this.isUniqueUsername(newAccount.username, user_id)
            .then(isUnique => {
                if (isUnique) {
                    this.saveUserFunction(newAccount)
                        .then((user) => {
                            res.send({
                                message: 'success',
                                data: user,
                                success: true
                            })
                        })
                        .catch(err => {
                            return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                        })
                } else {
                    res.send({
                        status: 200,
                        success: false,
                        message: 'This username is already exist'
                    })
                }
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
            })
    }

    saveUserFunction(user) {
        let _this = this;
        return new Promise((resolve, reject) => {
            if (user.user_id) {
                this.updateCredentials(user)
                    .then(newAccount => {
                        db['users'].update(newAccount, {where: {user_id: newAccount.user_id}})
                            .then(user => {
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
                    .catch(err => {
                        reject(err)
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
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', error], 1, 403);
            });
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
        const token = req.body.token || null;
        jwt.verify(token, config.secret, (err, data) => {
            res.send({
                success: !!!err,
                data: data,
                message: (err) ? 'Invalid token' : 'Tokan valid',
            });
        });
    }

    getSales(req, res, next) {
        let _this = this;
        let {account_id, user_id} = req.body;
        this.db['users'].findAll({where: {account_id: account_id, role_crm_id: 5, active: 'Y'}})
            .then(users => {
                let sales = users.filter(el => el.params.agents.includes(user_id));
                res.send({
                    status: 200,
                    message: 'success',
                    data: sales
                })
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
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
                        return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                    })
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
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
                        if(!params.sales.includes(sales_id)) {
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
                                this.db['meetings'].update({active: 'N'}, {
                                    where: {
                                        agent_id: notAssignedAgents.map(el => el.user_id),
                                        sales_id: user_id
                                    }
                                })
                                    .then(() => {
                                        res.send({
                                            status: 200,
                                            message: 'success'
                                        })
                                    })
                                    .catch(err => {
                                        return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                                    })
                            })
                            .catch(err => {
                                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                            })
                    })
                    .catch(err => {
                        return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                    })
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
            })
    }

}

module.exports = users;
