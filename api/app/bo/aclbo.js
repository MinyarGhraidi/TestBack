const {baseModelbo} = require("./basebo");
const {default: axios} = require("axios");
const db = require("../models");
const env = process.env.NODE_ENV || 'development';
const call_center_token = require(__dirname + '/../config/config.json')[env]["call_center_token"];
const base_url_cc_kam = require(__dirname + '/../config/config.json')[env]["base_url_cc_kam"];
const call_center_authorization = {
    headers: {Authorization: call_center_token}
};


class acls extends baseModelbo {
    constructor() {
        super('acls', 'acl_id');
        this.baseModal = 'acls';
        this.primaryKey = 'acl_id'
    }

    saveAcl(req, res, next) {
        const formData = req.body;

        if (!!!formData.name || !!!formData.description || !!!formData.default || !!!formData.server_uuid || !!!formData.server_id) {
            return this.sendResponseError(res, ['Error.EmptyFormData'], 0, 403);
        }

        axios
            .get(`${base_url_cc_kam}api/v1/servers/${formData.server_uuid}`, call_center_authorization).then((resp) => {
            if (!!!resp) {
                return res.send({
                    success: false,
                    message: "esl-server-not-found"
                })
            }
            const server_id = formData.server_id;
            delete formData.server_id;
            axios
                .post(`${base_url_cc_kam}api/v1/acls`, formData, call_center_authorization).then((resp) => {
                let params = resp.data.result;
                const acl = db.acls.build();
                acl.server_id = server_id;
                acl.name = formData.name;
                acl.description = formData.description;
                acl.default = formData.default;
                acl.params = params;
                acl.save().then(aclSaved => {
                    res.send({
                        success: true,
                        data: aclSaved
                    });
                }).catch((error) => {
                    return this.sendResponseError(res, ['Error.AnErrorHasOccurredSaveAcl'], 1, 403);
                });
            }).catch((err) => {
                res.send({
                    success: false,
                    message : "fail-catch",
                    messageError: err.response.data.errors || 'Failed Try again'
                })
            })
        }).catch((err) => {
            res.send({
                success: false,
                message : "fail-catch",
                messageError: err.response.data.errors || 'Failed Try again'
            })
        })


    }

    updateAcl(req, res, next) {
        let data = req.body
        let acl_id = data.acl_id;
        delete data.acl_id;

        if (!!!acl_id) {
            return this.sendResponseError(res, ['Error.Empty'], 1, 403);
        }
        this.db.acls.findOne({where: {acl_id: acl_id, active: 'Y'}})
            .then(result => {
                if (!!!result) {
                    return this.sendResponseError(res, ['Error.AclIdNotFound'], 1, 403);
                }
                if (!!!result.dataValues.params) {
                    return this.sendResponseError(res, ['Error.TelcoNotFound'], 1, 403);
                }
                let {uuid} = result.dataValues.params;
                if (!!!uuid) {
                    return this.sendResponseError(res, ['Error.uuidNotFound'], 1, 403);
                }
                axios
                    .get(`${base_url_cc_kam}api/v1/servers/${data.server_uuid}`, call_center_authorization).then((resp) => {
                    if (!!!resp) {
                        return res.send({
                            success: false,
                            message: "esl-server-not-found"
                        })
                    }
                    axios
                        .get(`${base_url_cc_kam}api/v1/acls/${uuid}`, call_center_authorization).then((resp) => {
                        let dataToUpdate = data;
                        dataToUpdate.updated_at = new Date();
                        axios
                            .put(`${base_url_cc_kam}api/v1/acls/${uuid}`, dataToUpdate, call_center_authorization).then((resp) => {
                            dataToUpdate.params = resp.data.result;
                            this.db.acls.update(dataToUpdate, {
                                where: {
                                    acl_id: acl_id,
                                    active: 'Y'
                                }
                            }).then(result => {
                                res.send({
                                    success: true
                                })
                            }).catch(err => {
                                return this.sendResponseError(res, ['Error', err], 1, 403);
                            })
                        }).catch((err) => {
                            res.send({
                                success: false,
                                messageError: err.response.data.errors,
                                message : "fail-catch"
                            })
                        })

                    }).catch((err) => {
                        return this.sendResponseError(res, ['Error.uuidNotFoundCannotUpdateAcl'], 1, 403);
                    })
                }).catch(err => {
                    return this.sendResponseError(res, ['Error.Cannot findServer_esl'], 1, 403);
                })
            }).catch(err => {
            return this.sendResponseError(res, ['Error.cannotGetACL DB'], 1, 403);
        })


    }

    deleteAcl(req, res, next) {

        const {acl_id} = req.params;
        if (!!!acl_id) {
            return this.sendResponseError(res, ['Error.Empty'], 1, 403);
        }
        this.db.acls.findOne({where: {acl_id: acl_id, active: 'Y'}})
            .then(result => {
                if (!!!result) {
                    return this.sendResponseError(res, ['Error.AclIdNotFound'], 1, 403);
                }
                if (!!!result.dataValues.params) {
                    return this.sendResponseError(res, ['Error.TelcoNotFound'], 1, 403);
                }
                let {uuid} = result.dataValues.params;
                if (!!!uuid) {
                    return this.sendResponseError(res, ['Error.uuidNotFound'], 1, 403);
                }
                axios
                    .delete(`${base_url_cc_kam}api/v1/acls/${uuid}`, call_center_authorization).then((resp) => {
                    let toUpdate = {
                        updated_at: new Date(),
                        active: 'N'
                    }
                    this.db.acls.update(toUpdate, {
                        where: {
                            acl_id: acl_id,
                            active: 'Y'
                        }
                    }).then(result => {
                        this.db.acl_nodes.update(toUpdate, {
                            where: {
                                acl_id: acl_id,
                                active: 'Y'
                            }
                        }).then(result => {
                            res.send({
                                success: true,
                                message: "Acl Deleted !"
                            })
                        }).catch(err => {
                            return this.sendResponseError(res, ['Error.CannotDeleteAclNodes', err], 1, 403);
                        })
                    }).catch(err => {
                        return this.sendResponseError(res, ['Error.CannotDeleteAcl', err], 1, 403);
                    })
                }).catch((err) => {
                    return this.sendResponseError(res, ['Error.CannotDeleteTelco'], 1, 403);
                })
            }).catch((err) => {
            return this.sendResponseError(res, ['Error.AclNotFound'], 1, 403);
        })
    }
}

module.exports = acls;
