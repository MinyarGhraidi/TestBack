const {baseModelbo} = require("./basebo");
const {default: axios} = require("axios");
const moment = require("moment");
const env = process.env.NODE_ENV || 'development';
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

    addEslServer(req,res,next){
        let data = req.body;

            let Server = {
                ip_addr: data.ip,
                esl_port: data.port,
                esl_pwd: data.password,
                description: data.description,
                created_at : moment(new Date()),
                updated_at : moment(new Date()),
            }
        axios
            .post(`${base_url_cc_kam}api/v1/servers`,Server, call_center_authorization).then((resp)=>{
            let sip_device = resp.data.result;
            const server = this.db['esl_servers'].build(data);
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
                this.deleteEslServerByUUID(sip_device.uuid).then(()=> {
                    this.sendResponseError(res,['Error.SaveServer',err],1,403)
                })
            })

        }).catch(err=>{
            this.sendResponseError(res,['Error.CannotAddServerTelco',err],1,403)
        })

    }

    editEslServer(req,res,next){
        let data = req.body;
        let ServerData = {}
        this.db['esl_servers'].findOne({where : {esl_server_id: data.esl_server_id}}).then((serverResp)=>{
            let sip_device = serverResp.dataValues.sip_device;
            const uuid_server = sip_device.uuid;
            if(!!!data.changeStatus) {
                ServerData = {
                    port: data.port,
                    description: data.description,
                    ip: data.ip,
                    password: data.password,
                    updated_at: moment(new Date()),
                }
            }else{
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
                enabled : enabled,
                updated_at : moment(new Date()),
            }
                axios
                    .put(`${base_url_cc_kam}api/v1/servers/${uuid_server}`,Server, call_center_authorization).then((resp)=>{
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

                }).catch(err=>{
                    this.sendResponseError(res,['Error.CannotUpdateServerTelco',err],1,403)
                })

        })

    }

    deleteEslServer(req,res,next){
        const {esl_server_id} = req.params;
        if (!!!esl_server_id) {
            return this.sendResponseError(res, ['Error.Empty'], 1, 403);
        }
        this.db['esl_servers'].findOne({where : {esl_server_id: esl_server_id}}).then((serverResp)=>{
            let sip_device = serverResp.sip_device;
            const uuid_server = sip_device.uuid;
            axios
        .delete(`${base_url_cc_kam}api/v1/servers/${uuid_server}`, call_center_authorization).then((resp) => {
            this.db['esl_servers'].update({active : 'N'},{where : {esl_server_id : esl_server_id}}).then(()=>{
                res.send({
                    success : true,
                    message : 'Server Deleted !',
                    status : 200
                })
            }).catch(err=>{
                return this.sendResponseError(res,['Error.CannotDeleteServerDB',err],1,403);
            })
            }).catch(err=>{
                return this.sendResponseError(res,['Error.CannotDeleteServerTelco',err],1,403);
            })
        }).catch(err=>{
            return this.sendResponseError(res,['Error.CannotGetServer',err],1,403);
        })
    }
}
module.exports = esl_servers
