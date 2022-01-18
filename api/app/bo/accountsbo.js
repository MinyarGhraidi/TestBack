const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
const Op = sequelize.Op;
let db = require('../models');
const {appSecret} = require("../helpers/app");
const jwt = require('jsonwebtoken');
const config = require('../config/config.json');

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

                    return this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', error], 1, 403);
                });
            }
        }
    }

    AddEditAccount(req, res, next) {
        let newAccount = req.body;
        if (newAccount.account_id) {
            this.db['accounts'].update(
                newAccount,
                {
                    where: {
                        account_id: newAccount.account_id
                    }
                }).then(account => {
                console.log(account[1])
                // this.updateCredentials(account[1])
                //     .then(Account => {
                //         db['users'].update(Account, {where: {user_id: newAccount.user_id}})
                //             .then(user => {
                //                 res.send({
                //                     message: 'success',
                //                     data: user
                //                 })
                //             })
                //             .catch(err => {
                //                 res.send(err)
                //             })
                //     })
                //     .catch(err => {
                //         res.send(err)
                //     })
            }).catch(err => {
                res.send(err)
            })
        } else {
            let modalObj = this.db['accounts'].build(newAccount);
            modalObj.save().then(new_account =>{
                let modalObjUser = this.db['users'].build(new_account);
                modalObjUser.save().then(new_user =>{
                    console.log(new_user)
                    // this.saveCredentials(new_user)
                    //     .then(data => {
                    //         let {newAccount, email_item} = data;
                    //         let modalObj = this.db['users'].build(newAccount);
                    //         modalObj.save()
                    //             .then(user => {
                    //                 this.db['emails'].update({user_id: user.user_id}, {where: {email_id: email_item.email_id}})
                    //                     .then(() => {
                    //                         res.send({
                    //                             message: 'success',
                    //                             data: user
                    //                         })
                    //                     })
                    //                     .catch(err => {
                    //                         res.send(err)
                    //                     })
                    //             })
                    //             .catch(err => {
                    //                 res.send(err)
                    //             })
                    //     })
                    //     .catch(err => {
                    //         res.send(err)
                    //     })
                })

            })

        }


    }

}

module.exports = accounts;
