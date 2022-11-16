const {baseModelbo} = require('./basebo');
const db = require("../models");
const moment = require("moment-timezone");
const pg = require("pg/lib/query");
const {default: axios} = require("axios");
const domainURL = 'https://sip-crm.oxilog-telecom.net:1443/api/v1/domains';
const domainAuth = {
    headers: {Authorization: 'Bearer BomjNx8kFfZTdCFx4kH3hGECO78yS0C0KS7pgO0BUe8COxcved'}
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
            .post(`${domainURL}`, formData, domainAuth).then((resp) => {
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
                success : false,
                message :err.response.data.errors.domain_name[0]
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
                    .get(`${domainURL}/${uuid}`, domainAuth).then((resp) => {
                    let dataToUpdate = data;
                    dataToUpdate.updatedAt = new Date();
                    if ("enabled" in data) {
                        dataToUpdate.status = data.enabled;
                    }
                    axios
                        .put(`${domainURL}/${uuid}`, dataToUpdate, domainAuth).then((resp) => {
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
                            success : false,
                            message :err.response.data.errors.domain_name[0]
                        })
                        //return this.sendResponseError(res, ['Error.CannotUpdateDomainTelco'], 1, 403);
                    })

                }).catch((err) => {
                    return this.sendResponseError(res, ['Error.uuidNotFoundCannotUpdateDomain'], 1, 403);
                })
            }).catch(err => {
            res.status(500).json(err)
            }
        )
    }

    findByIdDomain(req, res, next) {
        const {domain_id} = req.params;
        if (!!!domain_id) {
            return this.sendResponseError(res, ['Error.Empty'], 1, 403);
        }
        this.db.domains.findOne({where: {domain_id: domain_id, active: 'Y'}})
            .then(result => {
                if (!!!result) {
                    return this.sendResponseError(res, ['Error.DomainIdNotFound'], 1, 403);
                }
                res.json({
                    message: 'success',
                    data: result,
                    status: 1,
                });
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
                    .delete(`${domainURL}/${uuid}`, domainAuth).then((resp) => {
                        let toUpdate = {
                            updatedAt : new Date(),
                            active : 'N'
                        }
                    this.db.domains.update(toUpdate, {
                        where: {
                            domain_id: domain_id,
                            active: 'Y'
                        }
                    }).then(result => {
                        res.send({
                            success: true,
                            message : "Domain Deleted !"
                        })
                    }).catch(err => {
                        return this.sendResponseError(res, ['Error', err], 1, 403);
                    })
                }).catch((err)=>{
                    return this.sendResponseError(res, ['Error.CannotDeleteTelco'], 1, 403);
                })
            }).catch((err)=>{
            return this.sendResponseError(res, ['Error.DomainNotFound'], 1, 403);
        })
    }
}

module.exports = domains;
