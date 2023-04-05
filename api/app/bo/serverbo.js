const {baseModelbo} = require("./basebo");
const {default: axios} = require("axios");
const moment = require("moment");
const env = process.env.NODE_ENV || 'development';
const call_center_token = require(__dirname + '/../config/config.json')[env]["call_center_token"];
const base_url_cc_kam = require(__dirname + '/../config/config.json')[env]["base_url_cc_kam"];
const call_center_authorization = {
    headers: {Authorization: call_center_token}
};

class servers extends baseModelbo {
    constructor() {
        super('servers', 'server_id');
        this.baseModal = 'servers';
        this.primaryKey = 'server_id'
    }

    addServer(req,res,next){
        let data = req.body;

        axios
            .get(`${base_url_cc_kam}api/v1/acls`, call_center_authorization).then((resp) => {
                let providers = resp.data.result[0];
                let uuid_provider = providers.uuid;
            let Server = {
                cidr : data.ip,
                type : 'allow',
                description : data.description,
                created_at : moment(new Date()),
                updated_at : moment(new Date()),
            }
        axios
            .post(`${base_url_cc_kam}api/v1/acls/${uuid_provider}/nodes`,Server, call_center_authorization).then((resp)=>{
            let sip_device = resp.data.result;
            const server = this.db['servers'].build(data);
            server.updated_at = moment(new Date());
            server.created_at = moment(new Date());
            server.sip_device = sip_device;
            server.save().then((serverSaved)=>{
                res.json({
                    success: true,
                    data: serverSaved,
                    message: 'Server created with success!'
                })
            }).catch(err=>{
                this.sendResponseError(res,['Error.SaveServer',err],1,403)
            })

        }).catch(err=>{
            this.sendResponseError(res,['Error.CannotAddAclNodesForProvider',err],1,403)
        })
        }).catch(err => {
            this.sendResponseError(res,['Error.CannotGetAcls',err],1,403)
        })

    }

    editServer(req,res,next){
        let data = req.body;
        let ServerData = {}
        let Server = {}
        this.db['servers'].findOne({where : {server_id: data.server_id}}).then((serverResp)=>{
            let sip_device = serverResp.sip_device;
            const uuid_AclNode = sip_device.uuid;
            const uuid_Acl = sip_device.acl_uuid;
            if(!!!data.changeStatus) {
                ServerData = {
                    name: data.name,
                    description: data.description,
                    ip: data.ip,
                    updated_at: moment(new Date()),
                }
            }else{
                ServerData = {
                    name: serverResp.name,
                    description: serverResp.description,
                    ip: serverResp.ip,
                    updated_at: moment(new Date()),
                }
            }
                let Type = data.status === 'Y' ? 'allow' : 'deny';
                Server = {
                    cidr : ServerData.ip,
                    type : Type,
                    description : ServerData.description,
                    updated_at : moment(new Date()),
                }
                axios
                    .put(`${base_url_cc_kam}api/v1/acls/${uuid_Acl}/nodes/${uuid_AclNode}`,Server, call_center_authorization).then((resp)=>{
                    ServerData.sip_device = resp.data.result;
                    ServerData.status = data.status;
                    this.db['servers'].update(ServerData, {
                        where: {
                            server_id: data.server_id,
                            active: 'Y'
                        }
                    }).then(result => {
                        res.send({
                            success: true
                        })
                    }).catch(err => {
                        return this.sendResponseError(res, ['Error.CannotUpdateServer', err], 1, 403);
                    })

                }).catch(err=>{
                    this.sendResponseError(res,['Error.CannotUpdateAclNode',err],1,403)
                })

        })

    }

    deleteServer(req,res,next){
        const {server_id} = req.params;
        if (!!!server_id) {
            return this.sendResponseError(res, ['Error.Empty'], 1, 403);
        }
        this.db['servers'].findOne({where : {server_id: server_id}}).then((serverResp)=>{
            let sip_device = serverResp.sip_device;
            const uuid_AclNode = sip_device.uuid;
            const uuid_Acl = sip_device.acl_uuid;
            axios
        .delete(`${base_url_cc_kam}api/v1/acls/${uuid_Acl}/nodes/${uuid_AclNode}`, call_center_authorization).then((resp) => {
            this.db['servers'].update({active : 'N'},{where : {server_id : server_id}}).then(()=>{
                res.send({
                    success : true,
                    message : 'Server Deleted !',
                    status : 200
                })
            }).catch(err=>{
                return this.sendResponseError(res,['Error.CannotDeleteServer'],1,403);
            })
            }).catch(err=>{
                return this.sendResponseError(res,['Error.CannotDeleteAclNode'],1,403);
            })
        }).catch(err=>{
            return this.sendResponseError(res,['Error.CannotGetServer'],1,403);
        })
    }
}
module.exports = servers
