const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
const Op = sequelize.Op;
let db = require('../models');
const { appSecret} = require("../helpers/app");
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
                    res.send(err) ;
                } else {
                    this.db['accounts'].findOne({
                        where: {
                            account_id: decodedToken.user_id
                        }
                    }).then(user => {
                        res.send(user.dataValues) ;
                       
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
                        login: username,
                        active: 'Y'
                    }
                 
                }).then((user) => {
                  
                    if (!user) {
                        this.sendResponseError(res, ['Error.UserNotFound'], 0, 403);
                    } else {
                       
                        if (user.password === password) {

                            const token = jwt.sign({
                                user_id: user.account_id,
                                username: user.login
                                
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

                    return this.sendResponseError(res, ['Error.AnErrorHasOccuredUser',error], 1, 403);
                });
            }
        }
    }

}

module.exports = accounts;
