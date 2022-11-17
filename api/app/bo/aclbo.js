const {baseModelbo} = require("./basebo");
const {default: axios} = require("axios");
const db = require("../models");
const aclURL = 'https://sip-crm.oxilog-telecom.net:1443/api/v1/acls';
const aclAuth = {
    headers: {Authorization: 'Bearer BomjNx8kFfZTdCFx4kH3hGECO78yS0C0KS7pgO0BUe8COxcved'}
};
class acls extends baseModelbo {
    constructor() {
        super('acls', 'acl_id');
        this.baseModal = 'acls';
        this.primaryKey = 'acl_id'
    }
    saveAcl(req, res, next) {
        const formData = req.body;

        if (!formData.name || !formData.description || !formData.default) {
            return this.sendResponseError(res, ['Error.EmptyFormData'], 0, 403);
        }

        axios
            .post(`${aclURL}`, formData, aclAuth).then((resp) => {
            let params = resp.data.result;
            const acl = db.acls.build();
            acl.name = formData.name;
            acl.description = formData.description;
            acl.default = formData.default;
            acl.params = params;
            acl.save().then(aclSaved => {
                res.send({
                    success: true,
                    data: aclSaved,
                    message: 'Domain created with success!'
                });
            }).catch((error) => {
                return this.sendResponseError(res, ['Error.AnErrorHasOccurredSaveAcl'], 1, 403);
            });
        }).catch((err) => {
            res.send({
                success : false,
                message :err.response.data.errors
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
                    .get(`${aclURL}/${uuid}`, aclAuth).then((resp) => {
                    let dataToUpdate = data;
                    dataToUpdate.updated_at = new Date();
                    axios
                        .put(`${aclURL}/${uuid}`, dataToUpdate, aclAuth).then((resp) => {
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
                            success : false,
                            message :err.response.data.errors
                        })
                    })

                }).catch((err) => {
                    return this.sendResponseError(res, ['Error.uuidNotFoundCannotUpdateAcl'], 1, 403);
                })
            }).catch(err => {
                res.status(500).json(err)
            }
        )
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
                    .delete(`${aclURL}/${uuid}`, aclAuth).then((resp) => {
                    let toUpdate = {
                        updated_at : new Date(),
                        active : 'N'
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
                                message : "Acl Deleted !"
                            })
                        }).catch(err => {
                            return this.sendResponseError(res, ['Error.CannotDeleteAclNodes', err], 1, 403);
                        })
                    }).catch(err => {
                        return this.sendResponseError(res, ['Error.CannotDeleteAcl', err], 1, 403);
                    })
                }).catch((err)=>{
                    return this.sendResponseError(res, ['Error.CannotDeleteTelco'], 1, 403);
                })
            }).catch((err)=>{
            return this.sendResponseError(res, ['Error.AclNotFound'], 1, 403);
        })
    }
}
module.exports = acls;