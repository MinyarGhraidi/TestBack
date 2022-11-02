const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
const appSocket = new (require('../providers/AppSocket'))();

class roles extends baseModelbo {
    constructor() {
        super('roles', 'role_id');
        this.baseModal = "roles";
        this.primaryKey = 'role_id';
    }

    isUniqueRole(rolename, account_id, role_id) {
        let _this = this;
        return new Promise((resolve, reject) => {
            if (role_id !== undefined) {
                this.db['roles'].findAll({
                    where: {
                        role_name: rolename,
                        active: 'Y',
                        account_id: account_id,
                        role_id: {$not: role_id}
                    }
                })
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
            } else {
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
            }

        })
    }

    saveRole(req, res, next) {
        let _this = this;
        let {role_name, account_id, role_id} = req.body;
        this.isUniqueRole(role_name, account_id, role_id)
            .then(isUnique => {
                if (isUnique) {
                    if (role_id) {
                        this.db['roles'].update(req.body, {
                            where: {role_id: role_id},
                            returning: true,
                            plain: true
                        })
                            .then(role => {
                                if (role) {
                                    this.updateUserToken(role).then(result => {
                                        if (result){
                                            res.send({
                                                status: 200,
                                                success: true,
                                                message: 'Success',
                                                data: role
                                            })
                                        }else{
                                            res.send({
                                                success: false,
                                                message: 'error update',
                                            })
                                        }

                                    })

                                }
                            })
                            .catch(err => {
                                return _this.sendResponseError(res, ['cannot update role', err], 1, 403);
                            })
                    } else {
                        let modalObj = this.db['roles'].build(req.body)
                        modalObj.save()
                            .then(role => {
                                if (role) {
                                    res.send({
                                        status: 200,
                                        success: true,
                                        message: 'Success',
                                        data: role
                                    })
                                }
                            })
                            .catch(err => {
                                return _this.sendResponseError(res, ['cannot save role in db', err], 1, 403);
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
                return _this.sendResponseError(res, ['Error', err], 1, 403);
            })
    }

    deleteRole(req, res, next) {
        let id = req.params.params;
        this.db['roles'].update({
                active: 'N'
            },
            {
                where: {
                    role_id: id
                }
            }
        ).then(result => {
            if (result) {
                this.db['acls'].destroy({
                    where: {
                        role_id: id,
                    }
                }).then(result => {
                    res.json({
                        success: true,
                        messages: 'deleted'
                    })
                }).catch(err => {
                    return this.sendResponseError(res, ['Error', err], 1, 403);
                })

            } else {
                res.json({
                    success: false,
                    messages: 'Cant delete'
                })
            }
        }).catch(err =>
            res.status(500).json(err)
        )

    }

    updateUserToken(role) {
        return new Promise((resolve, reject) => {
            this.db['users'].update({
                current_session_token: null
            },{
                where: {
                    role_id: role[1].role_id,
                    active: 'Y',
                    status: 'Y'
                }
            }).then(user => {
                if (user) {
                    this.db['users'].findAll({
                        where:{
                            role_id: role[1].role_id,
                            active: 'Y',
                            status: 'Y'
                        }
                    }).then(userToken=>{
                        if(userToken && userToken.length !==0){

                            let index = 0;
                            userToken.forEach(item => {
                                appSocket.emit('reload.Permission', {user_id: item.user_id});
                                if (index < user.length - 1) {
                                    index++;
                                } else {
                                    resolve({
                                        success: true
                                    })
                                }
                            })
                        } else{
                            resolve({
                                success: true
                            })
                        }
                    }).catch(err=>{
                        reject(err)
                    })

                } else {
                    resolve({
                        success: true
                    })
                }
            }).catch(err => {
                reject(err)
            })
        })
    }


}

module.exports = roles;
