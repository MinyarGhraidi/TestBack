const {baseModelbo} = require("./basebo");
const moment = require("moment");
const db = require("../models");
const PromiseBB = require("bluebird");

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
                                if (PercentagesRestToTreat <= 10) {
                                    let data = {
                                        account_id: campaign.account_id,
                                        campaign_id: campaign_id,
                                        data: {
                                            total: totalCallFiles,
                                            totalTreated: totalToTreat,
                                            percentage: PercentagesRestToTreat + '%',
                                            reste: totalCallFiles - totalToTreat
                                        },
                                        status: 'Y',
                                        created_at: DateTZ,
                                        updated_at: DateTZ
                                    }
                                    let modalObj = this.db['notifications'].build(data);
                                    modalObj.save().then((notif) => {
                                        res.send({
                                            success: true,
                                            status: 200,
                                            data: notif
                                        })
                                    })
                                } else {
                                    res.send({
                                        success: false,
                                        status: 403
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

    findNotification(req, res, next) {
        let params = req.body;
        if (!!!params.account_id) {
            return this.sendResponseError(res, ['Error.Empty Req'], 1, 403);
        }
        let whereClause = {
            active: 'Y',
            account_id: params.account_id,
        }
        if (!!!!params.status) {
            whereClause['status'] = "Y";
        }
        const limit = parseInt(params.limit) > 0 ? params.limit : 1000;
        this.db['campaigns'].findAll({where : {account_id : params.account_id ,active : "Y"}}).then(campaigns => {
            this.db['listcallfiles'].findAll({where : {active : "Y"}}).then(listcallfiles => {
                this.db['notifications'].findAll({
                    where: whereClause,
                    order: [['created_at', 'DESC']]
                }).then(dataCountAll => {
                    dataCountAll.map(data => {
                        console.log(data.campaign_id)
                        if(data.campaign_id){
                            data.campaign = campaigns.filter(camp => camp.campaign_id === data.campaign_id);
                        }else{
                            data.list_callfile = listcallfiles.filter(lcf => lcf.campaign_id === data.list_callfile_id)
                        }
                    })
                    console.log(dataCountAll)
                    let CountUnreadMessages = 0;
                    let UnreadMessages = [];
                    let dataCountAllUnread = [];
                    let CountAllNotifications = dataCountAll.length;
                    if (CountAllNotifications !== 0) {
                        UnreadMessages = dataCountAll.filter(notif => notif.status === 'Y');
                        CountUnreadMessages = UnreadMessages.length;
                        dataCountAll = dataCountAll.slice(0, parseInt(limit));
                        dataCountAllUnread = UnreadMessages.slice(0, parseInt(limit));
                    }
                    let data = {
                        success: true,
                        status: 200,
                        data: !!!!params.status ? dataCountAllUnread : dataCountAll,
                        count: {
                            all: CountAllNotifications,
                            unread: CountUnreadMessages
                        }
                    }
                    res.send(data)

                })
                    .catch(err => {
                        return res.send({
                            success: false,
                            status: 403,
                            data: [],
                            count: {
                                all: 0,
                                unread: 0
                            }
                        })
                    })
            }).catch();
        }).catch();
    }

    updateByAccountID(req, res, next) {
        let account_id = req.body.account_id;
        if (!!!account_id) {
            return this.sendResponseError(res, ['Error.EmptyReq'], 1, 403);
        }
        this.db['notifications'].update({status: 'N', updated_at: moment(new Date())}, {
            where: {
                account_id: account_id,
                active: 'Y'
            }
        }).then(() => {
            res.send({
                status: 200,
                success: true
            })
        }).catch(err => {
            console.log(err)
            return this.sendResponseError(res, ['CannotUpdateNotifications'], 1, 403);
        })
    }

}

module.exports = notifications;
