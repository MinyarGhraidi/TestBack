const {baseModelbo} = require("./basebo");
const moment = require("moment");

class notifications extends baseModelbo {
    constructor() {
        super('notifications', 'notification_id');
        this.baseModal = "notifications";
        this.primaryKey = 'notification_id';
    }

    SaveNotification(req, res, next) {
        let {campaign_id} = req.body;
        this.db['campaigns'].findOne({where: {campaign_id: campaign_id, active: 'Y'}}).then(campaign => {
            if (!!!campaign) {
                res.send({
                    success: false,
                    status: 403
                })
            }
            if (Object.keys(campaign) && Object.keys(campaign).length !== 0) {
                this.db['listcallfiles'].findAll({
                    where: {
                        campaign_id: campaign_id,
                        active: 'Y',
                        status: 'Y'
                    }
                }).then(listcallfiles => {
                    if (listcallfiles && listcallfiles.length !== 0) {
                        let LCF_ids = [];
                        listcallfiles.forEach(LCF => LCF_ids.push(LCF.listcallfile_id));
                        this.db['callfiles'].findAll({
                            where: {
                                listcallfile_id: LCF_ids,
                                active: 'Y',
                            }
                        }).then(callfiles => {
                            if (callfiles && callfiles.length !== 0) {
                                let totalCallFiles = callfiles.length;
                                let totalToTreat = 0;
                                callfiles.forEach(CF => {
                                    if (CF.to_treat === 'Y') {
                                        totalToTreat += 1;
                                    }
                                })
                                let PercentagesRestToTreat = 100 - (100 * totalToTreat / totalCallFiles).toFixed(2);
                                let DateTZ = moment(new Date());
                                if (PercentagesRestToTreat <= 100) {
                                    let data = {
                                        account_id: campaign.account_id,
                                        campaign_id: campaign_id,
                                        data: {
                                            total: totalCallFiles,
                                            totalTreated: totalToTreat,
                                            percentage: PercentagesRestToTreat+'%',
                                            reste: totalCallFiles - totalToTreat
                                        },
                                        status : 'Y',
                                        created_at : DateTZ,
                                        updated_at : DateTZ
                                    }
                                    let modalObj = this.db['notifications'].build(data);
                                    modalObj.save().then((notif)=>{
                                        res.send({
                                            success : true,
                                            status : 200,
                                            data : notif
                                        })
                                    })
                                }else{
                                    res.send({
                                        success : false,
                                        status : 403
                                    })
                                }
                            } else {
                                return this.sendResponseError(res, ['Error.CannotGetCallFiles'], 1, 403)
                            }
                        }).catch(err => {
                            return this.sendResponseError(res, ['Error.CannotGetCallFiles', err], 1, 403)
                        })
                    } else {
                        return this.sendResponseError(res, ['Error.CannotGetListCallFile'], 1, 403)
                    }
                }).catch(err => {
                    return this.sendResponseError(res, ['Error.CannotGetListCallFile', err], 1, 403)
                })
            } else {
                return this.sendResponseError(res, ['Error.CannotGetCampaign'], 1, 403)
            }
        }).catch(err => {
            return this.sendResponseError(res, ['Error.CannotGetCampaign', err], 1, 403)
        })

    }
}

module.exports = notifications;
