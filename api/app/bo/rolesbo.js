const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');

class roles extends baseModelbo {
    constructor() {
        super('roles', 'role_id');
        this.baseModal = "roles";
        this.primaryKey = 'role_id';
    }

    isUniqueRole(rolename, account_id) {
        let _this = this;
        return new Promise((resolve, reject) => {
            this.db['roles'].findAll({where: {role_name: rolename, active: 'Y', account_id: account_id}})
                .then(data => {
                    if (data && data.length !== 0) {
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                })
                .catch(err => {
                    reject(err);
                })
        })
    }

    saveRole(req, res, next) {
        let _this = this;
        let {role_name, account_id, role_id} = req.body;
        this.isUniqueRole(role_name, account_id)
            .then(isUnique => {
                if (isUnique) {
                    if (role_id) {
                        this.db['roles'].update(req.body, {where: {role_id: role_id}})
                            .then(role => {
                                res.send({
                                    status: 200,
                                    success: true,
                                    message: 'Success',
                                    data: role
                                })
                            })
                            .catch(err => {
                                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                            })
                    } else {
                        let modalObj = this.db['roles'].build(req.body)
                        modalObj.save()
                            .then(role => {
                                res.send({
                                    status: 200,
                                    success: true,
                                    message: 'Success',
                                    data: role
                                })
                            })
                            .catch(err => {
                                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                            })
                    }
                } else {
                    res.send({
                        status: 200,
                        success: false,
                        message: 'This role name is already exist'
                    })
                }
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
            })
    }


}

module.exports = roles;
