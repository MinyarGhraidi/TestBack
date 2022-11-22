const {baseModelbo} = require('./basebo');
const db = require("../models");
const {default: axios} = require("axios");
const call_center_token = require(__dirname + '/../config/config.json')["call_center_token"];
const base_url_cc_kam = require(__dirname + '/../config/config.json')["base_url_cc_kam"];
const call_center_authorization = {
    headers: {Authorization: call_center_token}
};

class domains extends baseModelbo {
    constructor() {
        super('domains', 'domain_id');
        this.baseModal = 'domains';
        this.primaryKey = 'domain_id'
    }

    saveDomain(req, res, next) {
        const formData = req.body;

        if (!formData.domain_name || !formData.description) {
            return this.sendResponseError(res, ['Error.EmptyFormData'], 0, 403);
        }

        axios
            .post(`${base_url_cc_kam}api/v1/domains`, formData, call_center_authorization).then((resp) => {
            let params = resp.data.result;
            const domain = db.domains.build();
            domain.domain_name = formData.domain_name;
            domain.description = formData.description;
            domain.params = params;
            domain.save().then(domainSaved => {
                res.send({
                    success: true,
                    data: domainSaved,
                    message: 'Domain created with success!'
                });
            }).catch((error) => {
                return this.sendResponseError(res, ['Error.AnErrorHasOccurredSaveDomain'], 1, 403);
            });
        }).catch((err) => {
            res.send({
                success: false,
                message: err.response.data.errors.domain_name[0]
            })
        })

    }

    updateDomain(req, res, next) {
        let data = req.body
        let domain_id = data.domain_id;
        delete data.domain_id;

        if (!!!domain_id) {
            return this.sendResponseError(res, ['Error.Empty'], 1, 403);
        }
        this.db.domains.findOne({where: {domain_id: domain_id, active: 'Y'}})
            .then(result => {
                if (!!!result) {
                    return this.sendResponseError(res, ['Error.DomainIdNotFound'], 1, 403);
                }
                if (!!!result.dataValues.params) {
                    return this.sendResponseError(res, ['Error.TelcoNotFound'], 1, 403);
                }
                let {uuid} = result.dataValues.params;
                if (!!!uuid) {
                    return this.sendResponseError(res, ['Error.uuidNotFound'], 1, 403);
                }
                axios
                    .get(`${base_url_cc_kam}api/v1/domains/${uuid}`, call_center_authorization).then((resp) => {
                    let dataToUpdate = data;
                    dataToUpdate.updatedAt = new Date();
                    if ("enabled" in data) {
                        dataToUpdate.status = data.enabled;
                    }
                    axios
                        .put(`${base_url_cc_kam}api/v1/domains/${uuid}`, dataToUpdate, call_center_authorization).then((resp) => {
                        this.db.domains.update(dataToUpdate, {
                            where: {
                                domain_id: domain_id,
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
                            message: err.response.data.errors.domain_name[0]
                        })
                    })

                }).catch((err) => {
                    return this.sendResponseError(res, ['Error.uuidNotFoundCannotUpdateDomain'], 1, 403);
                })
            }).catch(err => {
                res.status(500).json(err)
            }
        )
    }

    deleteDomain(req, res, next) {
        const {domain_id} = req.params;
        if (!!!domain_id) {
            return this.sendResponseError(res, ['Error.Empty'], 1, 403);
        }
        this.db.domains.findOne({where: {domain_id: domain_id, active: 'Y'}})
            .then(result => {
                if (!!!result) {
                    return this.sendResponseError(res, ['Error.DomainIdNotFound'], 1, 403);
                }
                if (!!!result.dataValues.params) {
                    return this.sendResponseError(res, ['Error.TelcoNotFound'], 1, 403);
                }
                let {uuid} = result.dataValues.params;
                if (!!!uuid) {
                    return this.sendResponseError(res, ['Error.uuidNotFound'], 1, 403);
                }
                axios
                    .delete(`${base_url_cc_kam}api/v1/domains/${uuid}`, call_center_authorization).then((resp) => {
                    let toUpdate = {
                        updatedAt: new Date(),
                        active: 'N'
                    }
                    this.db.domains.update(toUpdate, {
                        where: {
                            domain_id: domain_id,
                            active: 'Y'
                        }
                    }).then(result => {
                        res.send({
                            success: true,
                            message: "Domain Deleted !"
                        })
                    }).catch(err => {
                        return this.sendResponseError(res, ['Error', err], 1, 403);
                    })
                }).catch((err) => {
                    return this.sendResponseError(res, ['Error.CannotDeleteTelco'], 1, 403);
                })
            }).catch((err) => {
            return this.sendResponseError(res, ['Error.DomainNotFound'], 1, 403);
        })
    }
}

module.exports = domains;
