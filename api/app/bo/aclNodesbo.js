const {baseModelbo} = require("./basebo");
const {default: axios} = require("axios");
const db = require("../models");
const  aclNodesURL = 'https://sip-crm.oxilog-telecom.net:1443/api/v1/acls';
const  aclNodesAuth = {
    headers: {Authorization: 'Bearer BomjNx8kFfZTdCFx4kH3hGECO78yS0C0KS7pgO0BUe8COxcved'}
};
class aclNodes extends baseModelbo {
    constructor() {
        super('acl_nodes', 'acl_node_id');
        this.baseModal = 'acl_nodes';
        this.primaryKey = 'acl_node_id'
    }
    saveAclNode(req, res, next) {
        const formData = req.body;
        let acl_id = formData.acl_id;
        delete formData.acl_id;
        if (!!!formData.type || !!!formData.cidr || !!!acl_id) {
            return this.sendResponseError(res, ['Error.EmptyFormData'], 0, 403);
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
                    .post(`${ aclNodesURL}/${uuid}/nodes`, formData,  aclNodesAuth).then((resp) => {
                    let params = resp.data.result;
                    const acl_node = db.acl_nodes.build();
                    acl_node.type = formData.type;
                    acl_node.description = formData.description || null;
                    acl_node.domain = formData.domain || null;
                    acl_node.cidr = formData.cidr;
                    acl_node.acl_id = acl_id;
                    acl_node.params = params;
                    acl_node.save().then(aclSaved => {
                        res.send({
                            success: true,
                            data: aclSaved,
                            message: 'Acl Node created with success!'
                        });
                    }).catch((error) => {
                        return this.sendResponseError(res, ['Error.AnErrorHasOccurredSaveAclNode'], 1, 403);
                    });
                }).catch((err) => {
                    res.send({
                        success : false,
                        message :err.response.data.errors
                    })
                })

            }).catch(err => {
            res.status(500).json(err)
        });


    }

    updateAclNode(req, res, next){
        let data = req.body
        let acl_node_id = data.acl_node_id;
        delete data.acl_node_id;

        if (!!!acl_node_id || !!!data.cidr || !!!data.type) {
            return this.sendResponseError(res, ['Error.Empty'], 1, 403);
        }
        this.db.acl_nodes.findOne({where: {acl_node_id: acl_node_id, active: 'Y'}})
            .then(result => {
                if (!!!result) {
                    return this.sendResponseError(res, ['Error.AclNodeIdNotFound'], 1, 403);
                }
                if (!!!result.dataValues.params) {
                    return this.sendResponseError(res, ['Error.TelcoNotFound'], 1, 403);
                }
                let {uuid, acl_uuid} = result.dataValues.params;
                if (!!!uuid || !!!acl_uuid) {
                    return this.sendResponseError(res, ['Error.uuid/acl_uuidNotFound'], 1, 403);
                }
                    let dataToUpdate = data;
                    dataToUpdate.updated_at = new Date();
                    axios
                        .put(`${ aclNodesURL}/${acl_uuid}/nodes/${uuid}`, dataToUpdate,  aclNodesAuth).then((resp) => {
                        this.db.acl_nodes.update(dataToUpdate, {
                            where: {
                                acl_node_id: acl_node_id,
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
            }).catch(err => {
                res.status(500).json(err)
            }
        )
    }

    deleteAclNode(req, res, next){
        const {acl_node_id} = req.params;
        if (!!!acl_node_id) {
            return this.sendResponseError(res, ['Error.Empty'], 1, 403);
        }
        this.db.acl_nodes.findOne({where: {acl_node_id: acl_node_id, active: 'Y'}})
            .then(result => {
                if (!!!result) {
                    return this.sendResponseError(res, ['Error.AclNodeIdNotFound'], 1, 403);
                }
                if (!!!result.dataValues.params) {
                    return this.sendResponseError(res, ['Error.TelcoNotFound'], 1, 403);
                }
                let {uuid , acl_uuid} = result.dataValues.params;
                if (!!!uuid || !!!acl_uuid) {
                    return this.sendResponseError(res, ['Error.uuid/acl_uuidNotFound'], 1, 403);
                }
                axios
                    .delete(`${ aclNodesURL}/${acl_uuid}/nodes/${uuid}`,  aclNodesAuth).then((resp) => {
                    let toUpdate = {
                        updated_at : new Date(),
                        active : 'N'
                    }
                    this.db.acl_nodes.update(toUpdate, {
                        where: {
                            acl_node_id: acl_node_id,
                            active: 'Y'
                        }
                    }).then(result => {
                        res.send({
                            success: true,
                            message : "AclNode Deleted !"
                        })
                    }).catch(err => {
                        return this.sendResponseError(res, ['Error', err], 1, 403);
                    })
                }).catch((err)=>{
                    return this.sendResponseError(res, ['Error.CannotDeleteTelco'], 1, 403);
                })
            }).catch((err)=>{
            return this.sendResponseError(res, ['Error.AclNodeNotFound'], 1, 403);
        })
    }

}
module.exports = aclNodes;