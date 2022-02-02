const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');

class roles extends baseModelbo {
    constructor() {
        super('roles', 'role_id');
        this.baseModal = "roles";
        this.primaryKey = 'role_id';
    }

    isUniqueRole(rolename, account_id, role_id) {
        let _this = this;
        return new Promise((resolve, reject) => {
            this.db['roles'].findAll({where: {role_name: rolename, active: 'Y', account_id: account_id , role_id: { $not: role_id}}})
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
        this.isUniqueRole(role_name, account_id ,role_id)
            .then(isUnique => {
                if (isUnique) {
                    if (role_id) {
                        this.db['roles'].update(req.body, {where: {role_id: role_id},
                            returning: true,
                            plain: true})
                            .then(role => {
                                this.db['acls'].destroy({
                                    where :{
                                        role_id: role[1].role_id,
                                    }
                                }).then(acl => {
                                    if(req.body.data_permissions.length !==0){
                                        this.saveOrUpdatePermission(req.body.data_permissions, role[1]).then(result => {
                                            res.send({
                                                status: 200,
                                                success: true,
                                                message: 'Success',
                                                data: role
                                            })
                                        }).catch(err =>{
                                            return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                                        })
                                    }else{
                                        res.send({
                                            status: 200,
                                            success: true,
                                            message: 'Success',
                                            data: role
                                        })
                                    }
                                }).catch(err=>{
                                    return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                                })
                            })
                            .catch(err => {
                                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                            })
                    } else {
                        let modalObj = this.db['roles'].build(req.body)
                        modalObj.save()
                            .then(role => {
                                if(req.body.data_permissions.length !==0){
                                    this.saveOrUpdatePermission(req.body.data_permissions , role).then(result =>{
                                        res.send({
                                            status: 200,
                                            success: true,
                                            message: 'Success',
                                            data: role
                                        })
                                    }).catch(err =>{
                                        return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                                    })
                                }else{
                                    res.send({
                                        status: 200,
                                        success: true,
                                        message: 'Success',
                                        data: role
                                    })
                                }


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


    saveOrUpdatePermission =(permissions , role) =>{
        return new Promise((resolve, reject) =>{
            let i =0
                permissions.forEach(index => {

                        let modalObjPermission = this.db['acls'].build({
                            role_id: role.role_id,
                            permission_acl_id: index
                        })
                        modalObjPermission.save().then(permission => {

                        }).catch(err => {

                        })

                    if (i < permissions.length - 1) {
                        i++
                    } else {
                        resolve({
                            success: true
                        })
                    }
                })

        })
    }

    deleteRole(req, res, next) {
        let id = req.params.params;

        this.db['roles'].update({
            active: 'N'
            },
            {where: {
                role_id: id
                }}
        ).then(result => {
            if (result) {
                this.db['acls'].destroy({
                    where :{
                        role_id: id,
                    }
                }).then(result =>{
                    res.json({
                        success: true,
                        messages: 'deleted'
                    })
                }).catch(err =>{
                    return this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
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


}

module.exports = roles;
