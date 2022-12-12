const {baseModelbo} = require('./basebo');
const moment = require("moment");

class didsgroups extends baseModelbo {
    constructor() {
        super('didsgroups', 'did_id');
        this.baseModal = "didsgroups";
        this.primaryKey = 'did_id';
    }

    affectDidsGpToCamp(req, res, next) {
        let _this = this;
        let {camp_id , didsGp_ids} = req.body;
        this.db['didsgroups'].update({campaign_id: null, updated_at : moment(new Date())}, {where: {campaign_id: camp_id}}).then(data => {
            this.db['didsgroups'].update({campaign_id: camp_id,updated_at : moment(new Date())}, {where: {did_id: {in : didsGp_ids}}}).then(data => {
                res.send({
                    success: true,
                    status: 200,
                    data: [],
                    message: 'Did group affected with success'
                })
            }).catch(err => {
                _this.sendResponseError(res, ['Error.AffectDidGroupsCampaign', err, 403]);
            })
        }).catch(err => {
            _this.sendResponseError(res, ['Error.ResetDidGroupsCampaign', err, 403]);
        })

    }
    changeStatusCascadeDID(did_id, status) {
        return new Promise((resolve, reject) => {
            const didGroup = new Promise ((resolve,reject) => {
                this.db['didsgroups'].update({status: status, updated_at: moment(new Date())}, {
                    where: {
                        did_id: did_id,
                        active: 'Y'
                    }
                }).then(() => {
                   resolve(true);
                }).catch(err => {
                    reject(err);
                });
            });
            const did = new Promise ((resolve,reject) => {
                this.db['dids'].update({status: status, updated_at: moment(new Date())}, {
                    where: {
                        did_group_id: did_id,
                        active: 'Y'
                    }
                }).then(() => {
                    resolve(true);
                }).catch(err => {
                    reject(err);
                });
            });
            Promise.all([didGroup,did]).then(()=>{
                resolve(true);
            }).catch((err)=>{
                reject(err);
            })


        })
    }
    changeStatus(req, res, next) {
        let _this = this;
        let {did_id, status} = req.body;
        if ((!!!did_id || !!!status)) {
            return this.sendResponseError(res, ['Error.RequestDataInvalid'], 0, 403);
        }
        if (status !== 'N' && status !== 'Y') {
            return this.sendResponseError(res, ['Error.StatusMustBe_Y_Or_N'], 0, 403);
        }
        this.db['didsgroups'].findOne({where: {did_id: did_id, active: 'Y'}})
            .then(DID => {
                if (DID) {
                    this.changeStatusCascadeDID(did_id, status).then(() => {
                        res.send({
                            status: 200,
                            message: "success"
                        })
                    }).catch((err)=>{
                        return _this.sendResponseError(res, ['cannot update Dids', err], 1, 403);
                    })
                }else {
                    return _this.sendResponseError(res, ['DIDs not found'], 1, 403);
                }
            }).catch(err => {
            return _this.sendResponseError(res, ['cannot fetch DIDs', err], 1, 403);
        })


    }
}

module.exports = didsgroups;