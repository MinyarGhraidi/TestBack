const {baseModelbo} = require("./basebo");
const {default: axios} = require("axios");
const moment = require("moment");
const accountsbo = require("./accountsbo");
const env = process.env.NODE_ENV || 'development';
let _accountsbo = new accountsbo();
const call_center_token = require(__dirname + '/../config/config.json')[env]["call_center_token"];
const base_url_cc_kam = require(__dirname + '/../config/config.json')[env]["base_url_cc_kam"];
const call_center_authorization = {
    headers: {Authorization: call_center_token}
};

class esl_servers extends baseModelbo {
    constructor() {
        super('esl_servers', 'esl_server_id');
        this.baseModal = 'esl_servers';
        this.primaryKey = 'esl_server_id'
    }


    addEslServer(req, res, next) {
        let {ip, port, password, description} = req.body;
        if (!!!ip || !!!port || !!!password || !!!description) {
            return this.sendResponseError(res, ['Error.EmptyFormData'], 0, 403);
        }
        let Server = {
            ip_addr: ip,
            esl_port: port,
            esl_pwd: password,
            description: description,
            created_at: moment(new Date()),
            updated_at: moment(new Date()),
        }
        axios
            .post(`${base_url_cc_kam}api/v1/servers`, Server, call_center_authorization).then((resp) => {
            let formData = {
                "server_uuid": resp.data.result.uuid,
                "name": "providers",
                "default": "allow",
                "description": ""
            }
            let sip_device = resp.data.result;
            axios
                .post(`${base_url_cc_kam}api/v1/acls`, formData, call_center_authorization).then((resultAcl) => {
                let uuid_provider = resultAcl.data.result.uuid;
                this.creatAclNodes(uuid_provider).then(resultAclNode => {
                    if (resultAclNode.success) {
                        const server = this.db['esl_servers'].build(req.body);
                        server.updated_at = moment(new Date());
                        server.created_at = moment(new Date());
                        server.sip_device = sip_device;
                        server.save().then((serverSaved) => {
                            res.json({
                                success: true,
                                data: serverSaved,
                                message: 'Server created with success!'
                            })
                        }).catch(err => {
                            this.deleteEslServerByUUID(sip_device.uuid).then(() => {
                                this.sendResponseError(res, ['Error.SaveServer', err], 1, 403)
                            })
                        })
                    }
                }).catch(err => {
                    this.deleteEslServerByUUID(sip_device.uuid).then(() => {
                        this.sendResponseError(res, ['Error.SaveServer', err], 1, 403)
                    }).catch(err => {
                        this.sendResponseError(res, ['Error.DeleteServer', err], 1, 403)
                    })
                })
            }).catch(err => {
                this.deleteEslServerByUUID(sip_device.uuid).then(() => {
                    this.sendResponseError(res, ['Error.SaveServer', err], 1, 403)
                }).catch(err => {
                    this.sendResponseError(res, ['Error.DeleteServer', err], 1, 403)
                })
            })

        }).catch(err => {
            this.sendResponseError(res, ['Error.CannotAddServerTelco', err], 1, 403)
        })
    }

    editEslServer(req, res, next) {
        let data = req.body;
        if (!!!data.esl_server_id) {
            return this.sendResponseError(res, ['Error.EmptyFormData'], 0, 403);
        }
        let ServerData = {}
        this.db['esl_servers'].findOne({where: {esl_server_id: data.esl_server_id}}).then((serverResp) => {
            let sip_device = serverResp.dataValues.sip_device;
            const uuid_server = sip_device.uuid;
            if (!!!data.changeStatus) {
                ServerData = {
                    port: data.port,
                    description: data.description,
                    ip: data.ip,
                    password: data.password,
                    updated_at: moment(new Date()),
                }
            } else {
                ServerData = {
                    ip: sip_device.ip_addr,
                    port: sip_device.esl_port,
                    description: sip_device.description,
                    password: sip_device.esl_pwd,
                    updated_at: moment(new Date()),
                }
            }
            let enabled = data.status === 'Y' ? 1 : 0;
            let Server = {
                ip_addr: ServerData.ip,
                esl_port: ServerData.port,
                esl_pwd: ServerData.password,
                description: ServerData.description,
                enabled: enabled,
                updated_at: moment(new Date()),
            }
            axios
                .put(`${base_url_cc_kam}api/v1/servers/${uuid_server}`, Server, call_center_authorization).then((resp) => {
                ServerData.sip_device = resp.data.result;
                ServerData.status = data.status;
                this.db['esl_servers'].update(ServerData, {
                    where: {
                        esl_server_id: data.esl_server_id,
                        active: 'Y'
                    }
                }).then(() => {
                    res.send({
                        success: true
                    })
                }).catch(err => {
                    return this.sendResponseError(res, ['Error.CannotUpdateServerDB', err], 1, 403);
                })

            }).catch(err => {
                this.sendResponseError(res, ['Error.CannotUpdateServerTelco', err], 1, 403)
            })

        })

    }

    deleteEslServer(req, res, next) {
        const {esl_server_id} = req.params;
        if (!!!esl_server_id) {
            return this.sendResponseError(res, ['Error.Empty'], 1, 403);
        }
        this.db['esl_servers'].findOne({where: {esl_server_id: esl_server_id}}).then((serverResp) => {
            let sip_device = serverResp.sip_device;
            const uuid_server = sip_device.uuid;
            axios
                .delete(`${base_url_cc_kam}api/v1/servers/${uuid_server}`, call_center_authorization).then((resp) => {
                this.db['esl_servers'].update({active: 'N'}, {where: {esl_server_id: esl_server_id}}).then(() => {
                    res.send({
                        success: true,
                        message: 'Server Deleted !',
                        status: 200
                    })
                }).catch(err => {
                    return this.sendResponseError(res, ['Error.CannotDeleteServerDB', err], 1, 403);
                })
            }).catch(err => {
                return this.sendResponseError(res, ['Error.CannotDeleteServerTelco', err], 1, 403);
            })
        }).catch(err => {
            return this.sendResponseError(res, ['Error.CannotGetServer', err], 1, 403);
        })
    }

    changeStatusDomainsByServer(server_id, status) {
        return new Promise((resolve, reject) => {
            let idx_domains = 0;
            this.db.domains.findAll({where: {esl_server_id: server_id, active: 'Y'}}).then(domainsDB => {
                if (!!!domainsDB || domainsDB.length === 0) {
                    resolve(true)
                }
                domainsDB.forEach(domain_db => {
                    this._changeStatusTelco(status, 'domains', domain_db.params.uuid).then(updated_domainTelco => {
                        this.db.domains.update({
                            status: status,
                            updated_at: moment(new Date()),
                            sip_device: updated_domainTelco
                        }, {where: {esl_server_id: server_id, active: 'Y'}}).then(() => {
                            if (idx_domains < domainsDB.length - 1) {
                                idx_domains++;
                            } else {
                                const domains_ids = domainsDB.map(domain => domain.domain_id);
                                resolve(domains_ids)
                            }
                        })
                    }).catch(err => reject(err))
                })
            }).catch(err => reject(err))
        })
    }

    changeStatusAclsByServer(server_id, status) {
        return new Promise((resolve, reject) => {
            let idx_acls = 0;
            this.db.acls.findAll({where: {server_id: server_id, active: 'Y'}}).then(aclsDB => {
                if (!!!aclsDB || aclsDB.length === 0) {
                    resolve(true)
                }
                aclsDB.forEach(acl_db => {
                    this._changeStatusTelco(status, 'acls', acl_db.params.uuid).then(updated_AclTelco => {
                        this.db.acls.update({
                            default: status === 'Y' ? 'allow' : 'deny',
                            updated_at: moment(new Date()),
                            params: updated_AclTelco
                        }, {where: {server_id: server_id, active: 'Y'}}).then(() => {
                            if (idx_acls < idx_acls.length - 1) {
                                idx_acls++;
                            } else {
                                resolve(true)
                            }
                        })
                    }).catch(err => reject(err))
                })
            }).catch(err => reject(err))
        })
    }

    changeStatusAccountsByDomainIds(domain_ids, status) {
        return new Promise((resolve, reject) => {
            let idx_accounts = 0;
            this.db.accounts.findAll({where: {domain_id: domain_ids, active: 'Y'}}).then(accounts => {
                if (!!!accounts || accounts.length === 0) {
                    resolve(true)
                }
                accounts.forEach(account => {
                    _accountsbo.changeStatus(account.account_id, status).then(() => {
                        this.db['accounts'].update({
                            status: status,
                            updated_at: moment(new Date()),
                        }, {where: {domain_id: domain_ids, active: 'Y'}}).then(() => {
                            if (idx_accounts < idx_accounts.length - 1) {
                                idx_accounts++;
                            } else {
                                resolve(true)
                            }
                        })
                    }).catch(err => reject(err))
                })
            })
        })
    }

    changeStatusServer(req, res, next) {
        let {status, server_id} = req.body;
        if (!!!status || !!!server_id) {
            return this.sendResponseError(res, ['Error.EmptyFormData'], 0, 403);
        }
        this.db['esl_servers'].findOne({where: {esl_server_id: server_id, active: 'Y'}}).then(serverDB => {
            if (!!!serverDB) {
                return this.sendResponseError(res, ['Error.ServerNotFoundInDB'], 1, 403);
            }
            let sip_device_server = serverDB.sip_device;

            this._changeStatusTelco(status, 'servers', sip_device_server.uuid).then(updated_serverTelco => {
                this.db['esl_servers'].update({
                    status: status,
                    updated_at: moment(new Date()),
                    sip_device: updated_serverTelco
                }, {where: {esl_server_id: server_id, active: 'Y'}}).then(() => {
                    this.changeStatusDomainsByServer(server_id, status).then((domain_ids) => {
                        this.changeStatusAclsByServer(server_id, status).then(() => {
                            this.changeStatusAccountsByDomainIds(domain_ids, status).then(() => {
                                return res.send({
                                    status: 200,
                                    success: true
                                })
                            }).catch(err => {
                                return this.sendResponseError(res, ['cannotChangeStatusAccount', err], 1, 403)
                            })
                        }).catch(err => {
                            return this.sendResponseError(res, ['cannotChangeStatusAcl', err], 2, 403)
                        })
                    }).catch(err => {
                        return this.sendResponseError(res, ['cannotChangeStatusDomain', err], 3, 403)
                    })
                }).catch(err => {
                    return this.sendResponseError(res, ['cannotUpdateEslServer', err], 4, 403)
                })
            }).catch(err => {
                return this.sendResponseError(res, ['cannotChangeStatusServer', err], 5, 403)
            })
        }).catch(err => {
            return this.sendResponseError(res, ['cannotFindEslServer', err], 6, 403)
        })
    }

    creatAclNodes(uuid_provider) {
        return new Promise((resolve, reject) => {
            this.db['servers'].findAll({
                where: {
                    status: 'Y',
                    active: 'Y'
                }
            }).then(serverDailer => {
                if (serverDailer && serverDailer.length !== 0) {
                    let index = 0
                    serverDailer.forEach(item => {
                        let DataAclNode = {
                            cidr: item.ip,
                            type: 'allow',
                            created_at: moment(new Date()),
                            updated_at: moment(new Date()),
                        }
                        axios
                            .post(`${base_url_cc_kam}api/v1/acls/${uuid_provider}/nodes`, DataAclNode, call_center_authorization).then((resultAclNode) => {
                            if (index < serverDailer.length - 1) {
                                index++;
                            } else {
                                resolve({
                                    success: true
                                })
                            }
                        }).catch(err => {
                            reject(err)
                        })
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

module.exports = esl_servers
