const {baseModelbo} = require("./basebo");
const moment = require("moment");
const appSocket = new (require('../providers/AppSocket'))();

class notifications extends baseModelbo {
    constructor() {
        super('notifications', 'notification_id');
        this.baseModal = "notifications";
        this.primaryKey = 'notification_id';
    }

    _saveNotificationByCampaign_id(campaign_id) {
        return new Promise((resolve, reject) => {
            this.db['campaigns'].findOne({where: {campaign_id: campaign_id, active: 'Y'}}).then(campaign => {
                if (!!!campaign) {
                    reject(false);
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
                            let idx = 0;
                            let totalCallFiles = 0;
                            let totalTreated = 0;
                            LCF_ids.forEach((LCF_id) => {
                                this._saveNotificationByListCallFile_id(LCF_id, campaign.account_id).then(result => {
                                    totalCallFiles += result.data.total;
                                    totalTreated += result.data.totalTreated;
                                    if (idx < LCF_ids.length - 1) {
                                        idx++
                                    } else {
                                        let PercentagesRestToTreat = 100 - (100 * totalTreated / totalCallFiles).toFixed(2);
                                        if (PercentagesRestToTreat <= 10) {
                                            this.db['notifications'].findOne({
                                                where: {
                                                    campaign_id: campaign_id,
                                                    active: 'Y',
                                                    created_at : {
                                                        $gte: moment().subtract(1, 'hours').toDate()
                                                    }
                                                },
                                                order: [['created_at', 'DESC']],
                                                limit : 1
                                            }).then(LCF_Notifications =>{
                                                if (LCF_Notifications && LCF_Notifications.length !== 0) {
                                                    resolve({
                                                        success : false,
                                                        data: []
                                                    })
                                                }else{
                                                    let DateTZ = moment(new Date());
                                                    let data = {
                                                        account_id: campaign.account_id,
                                                        campaign_id: campaign_id,
                                                        data: {
                                                            total: totalCallFiles,
                                                            totalTreated: totalTreated,
                                                            percentage: PercentagesRestToTreat + '%',
                                                            reste: totalCallFiles - totalTreated
                                                        },
                                                        status: 'Y',
                                                        created_at: DateTZ,
                                                        updated_at: DateTZ
                                                    }
                                                    let modalObj = this.db['notifications'].build(data);
                                                    modalObj.save().then((notif) => {
                                                        appSocket.emit('save_notification', {
                                                            account_id : campaign.account_id,
                                                            campaign_id,
                                                            percentage: PercentagesRestToTreat + '%'
                                                        });
                                                        resolve({
                                                            success: true,
                                                            data: notif
                                                        });
                                                    })
                                                }
                                            }).catch(err=> reject(err));
                                        }else{
                                            resolve({
                                                success: true,
                                                data: []
                                            });
                                        }
                                    }
                                })
                            })
                        }else{
                            resolve({
                                success: true,
                                data: []
                            });
                        }
                    }).catch(err => {
                        resolve({
                            success: false,
                            message: 'Error.CannotGetListCallFile'
                        })
                    })
                } else {
                    resolve({
                        success: false,
                        message: 'Error.CannotGetCampaign'
                    })
                }
            }).catch(err => {
                resolve({
                    success: false,
                    message: 'Error.CannotGetCampaign'
                })
            })
        })
    }

    _saveNotificationByListCallFile_id(listCallFile_id, account_id) {
        return new Promise((resolve, reject) => {

            this.db['listcallfiles'].findOne({
                where: {
                    listcallfile_id: listCallFile_id,
                    active: 'Y',
                    status: 'Y'
                }
            }).then(listcallfile => {
                if (Object.keys(listcallfile) && Object.keys(listcallfile).length !== 0) {
                    this.db['callfiles'].findAll({
                        where: {
                            listcallfile_id: listCallFile_id,
                            active: 'Y',
                        }
                    }).then(callfiles =>
                    {
                        if (callfiles && callfiles.length !== 0) {
                            let totalCallFiles = callfiles.length;
                            let totalToTreat = 0;
                            callfiles.forEach(CF => {
                                if (CF.save_in_hooper === 'Y') {
                                    totalToTreat += 1;
                                }
                            })
                            let PercentagesRestToTreat = 100 - (100 * totalToTreat / totalCallFiles).toFixed(2);
                            let DateTZ = moment(new Date());
                            if (PercentagesRestToTreat <= 10) {
                                let data = {
                                    account_id: account_id,
                                    list_callfile_id: listCallFile_id,
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
                                this.db['notifications'].findOne({
                                    where: {
                                        list_callfile_id: listCallFile_id,
                                        active: 'Y',
                                        created_at : {
                                            $gte: moment(new Date()).subtract(1, 'hours').toDate()
                                        }
                                    },
                                    order: [['created_at', 'DESC']],
                                    limit : 1
                                }).then(LCF_Notifications => {
                                    if (LCF_Notifications && LCF_Notifications.length !== 0) {
                                        resolve({
                                            success: true,
                                            message: "ListCallFile already Pushed To Notif",
                                            data: {
                                                total: totalCallFiles,
                                                totalTreated: totalToTreat,
                                                rest: totalCallFiles - totalToTreat
                                            }
                                        })
                                    } else {
                                        let modalObj = this.db['notifications'].build(data);
                                        modalObj.save().then(() => {
                                            appSocket.emit('save_notification', {
                                                account_id,
                                                listCallFile_id,
                                                percentage: PercentagesRestToTreat + '%'
                                            });
                                            resolve({
                                                success: true,
                                                data: {
                                                    total: totalCallFiles,
                                                    totalTreated: totalToTreat,
                                                    rest: totalCallFiles - totalToTreat
                                                }
                                            });
                                        })
                                    }
                                }).catch(err => reject(err))
                            }else{
                                resolve({
                                    success: true,
                                    message: PercentagesRestToTreat + '% > 10%',
                                    data: {
                                        total: totalCallFiles,
                                        totalTreated: totalToTreat,
                                        rest: totalCallFiles - totalToTreat
                                    }
                                })
                            }
                        } else {
                            resolve({
                                success: false,
                                message: 'Error.CannotGetCallFiles'
                            })
                        }
                    }).catch(err => {
                        resolve({
                            success: false,
                            message: 'Error.CannotGetCallFiles'
                        })
                    })
                }
                else {
                    resolve({
                        success: false,
                        message: 'Error.CannotGetListCallFile'
                    })
                }
            }).catch(err => {
                resolve({
                    success: false,
                    message: 'Error.CannotGetListCallFile'
                })
            })
        })
    }

    SaveNotification(req, res, next) {

        if (req.body.campaign_id) {
            this._saveNotificationByCampaign_id(req.body.campaign_id).then(result => {
                if (result.success) {
                    return res.send({
                        success: true,
                        status: 200,
                        data: result.data
                    })
                } else {
                    return res.send({
                        success: false,
                        status: 403,
                        data: [],
                        message: result.message
                    })
                }
            }).catch(err => {
                return this.sendResponseError(res, ['CannotSaveNotification'], 1, 403);
            })
        }
        else {
            return this.sendResponseError(res, ["Error.CannotSave"], 1, 403);
        }
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
        this.db['campaigns'].findAll({where: {account_id: params.account_id, active: "Y"}}).then(campaigns => {
            this.db['listcallfiles'].findAll({where: {active: "Y"}}).then(listcallfiles => {
                this.db['notifications'].findAll({
                    where: whereClause,
                    order: [['created_at', 'DESC']]
                }).then(dataCountAll => {
                    dataCountAll.map(data => {
                        if (data.campaign_id !== null) {
                            let campToAdd = campaigns.filter(camp => camp.campaign_id === data.campaign_id);
                            data.dataValues.campaign = campToAdd[0].toJSON();
                        } else {
                            let lcfToAdd = listcallfiles.filter(lcf => lcf.listcallfile_id === data.list_callfile_id);
                            if(lcfToAdd && lcfToAdd.length !== 0) {
                                data.dataValues.listcallfile = lcfToAdd[0].toJSON();
                            }
                        }
                    })
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
                        console.log(err)
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
            }).catch(err => {
                return res.send({
                    success: false,
                    status: 403,
                    data: [],
                    count: {
                        all: 0,
                        unread: 0
                    }
                })
            });
        }).catch(err => {
            return res.send({
                success: false,
                status: 403,
                data: [],
                count: {
                    all: 0,
                    unread: 0
                }
            })
        });
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
            return this.sendResponseError(res, ['CannotUpdateNotifications'], 1, 403);
        })
    }

}

module.exports = notifications;
