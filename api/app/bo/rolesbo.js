const {baseModelbo} = require('./basebo');

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

    changeStatus(req, res, next) {
        let _this = this;
        let {role_id, status} = req.body;
        if ((!!!role_id || !!!status)) {
            return this.sendResponseError(res, ['Error.RequestDataInvalid'], 0, 403);
        }
        if (status !== 'N' && status !== 'Y') {
            return this.sendResponseError(res, ['Error.StatusMustBe_Y_Or_N'], 0, 403);
        }
        this.db['roles'].findOne({where: {role_id: role_id, active: 'Y'}})
            .then(role => {
                if (role) {
                    this.updateRoleAndUserToken(role.role_id, status).then(() => {
                        res.send({
                            status: 200,
                            message: "success"
                        })
                    })
                }
            }).catch(err => {
            return _this.sendResponseError(res, ['cannot find role', err], 1, 403);
        })


    }

    saveRole(req, res, next) {
        let _this = this;
        let {role_name, account_id, role_id} = req.body;
        this.isUniqueRole(role_name, account_id, role_id)
            .then(isUnique => {
                if (isUnique) {
                    if (role_id) {
                        this.updateRoleAndUserToken(role_id,'edit',req.body).then(result => {
                            if (result) {
                                res.send({
                                    status: 200,
                                    success: true,
                                    message: 'Success',
                                })
                            } else {
                                res.send({
                                    success: false,
                                    message: 'error update',
                                })
                            }

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


}

module.exports = roles;
