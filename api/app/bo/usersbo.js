const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
const {validateEmail} = require("../helpers/helpers");
const config = require('../config/config.json');
const jwt = require('jsonwebtoken');

class users extends baseModelbo {
    constructor() {
        super('users', 'user_id');
        this.baseModal = 'users';
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

        if ((!req.body.username || !req.body.password)) {
            return this.sendResponseError(res, ['Error.RequestDataInvalid'], 0, 403);
        } else {
            const {username, password} = req.body;
            if (username && password) {
                this.db['users'].findOne({
                    include: [{
                        model: db.roles_crms,
                    }],
                    where: {
                        username: username,
                        active: 'Y'
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
                                    as: 'permission',
                                }],
                                where: {
                                    roles_crm_id: user.role_crm_id,
                                }
                            }).then(permissions =>{
                                this.getPermissionsValues(permissions).then(data_perm =>{
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

    getPermissionsValues = (permissions) => {
        return new Promise((resolve, reject) => {
            if (permissions && permissions.length !== 0) {
                let permissions_values = [];
                let index = 0;
                permissions.forEach(item_perm => {
                    permissions_values.push(item_perm.permission.value);
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

}

module.exports = users;
