const {baseModelbo} = require("./basebo");
const moment = require("moment");
const Op = require("sequelize/lib/operators");
const db = require("../models");
const {Sequelize} = require("sequelize");
const appSocket = new (require('../providers/AppSocket'))();

class notifications extends baseModelbo {
    constructor() {
        super('notifications', 'notification_id');
        this.baseModal = "notifications";
        this.primaryKey = 'notification_id';
    }
    addMinutesToTime(minutes, timeString) {
        const [hours, mins] = timeString.split(":").map(Number);
        const totalMins = hours * 60 + mins + minutes;
        const newHours = Math.floor(totalMins / 60) % 24;
        const newMins = totalMins % 60;
        const formattedHours = newHours.toString().padStart(2, "0");
        const formattedMins = newMins.toString().padStart(2, "0");
        const beforeMidnight = [];
        const afterMidnight = [];
        let currentHours = hours;
        let currentMins = mins;
        const NewDay = currentHours === newHours;
        while (currentHours !== newHours || currentMins !== newMins) {
            const formattedCurrentHours = currentHours.toString().padStart(2, "0");
            const formattedCurrentMins = currentMins.toString().padStart(2, "0");
            if (currentHours > 0 || NewDay) {
                beforeMidnight.push(`${formattedCurrentHours}:${formattedCurrentMins}`);
            } else {
                afterMidnight.push(`${formattedCurrentHours}:${formattedCurrentMins}`);
            }
            currentMins += 1;
            if (currentMins === 60) {
                currentMins = 0;
                currentHours += 1;
                if (currentHours === 24) {
                    currentHours = 0;
                }
            }
        }
        if (currentHours > 0 || NewDay) {
            beforeMidnight.push(`${formattedHours}:${formattedMins}`);
        } else {
            afterMidnight.push(`${formattedHours}:${formattedMins}`);
        }
            return { beforeMidnight, afterMidnight};
    }
    saveNotificationReminder(req,res,next){
        let currDate = new Date();
        let hoursMin = currDate.getHours() + ':' + currDate.getMinutes();
        let hoursMinExp = "00:00";
        const tomorrow = new Date(currDate.getTime() + 24 * 60 * 60 * 1000);
        const yyyy_Now = currDate.getFullYear();
        const yyyy_Tomorrow = tomorrow.getFullYear();
        let mm_Now = currDate.getMonth() + 1;
        let mm_Tomorrow = tomorrow.getMonth() + 1;
        let dd_Now = currDate.getDate();
        let dd_Tomorrow = tomorrow.getDate();
        if (dd_Now < 10) dd_Now = '0' + dd_Now;
        if (mm_Now < 10) mm_Now = '0' + mm_Now;

        if (dd_Tomorrow < 10) dd_Tomorrow = '0' + dd_Tomorrow;
        if (mm_Tomorrow < 10) mm_Tomorrow = '0' + mm_Tomorrow;
        const formattedToday = yyyy_Now + '-' + mm_Now + '-' + dd_Now;
        const formattedTomorrow = yyyy_Tomorrow + '-' + mm_Tomorrow + '-' + dd_Tomorrow;
        const ArrayTimes = this.addMinutesToTime(15,hoursMin);
        this.db['reminders'].findAll({
            include: [{
                model: db.notifications,
                required : false
            },
            ],
            where : {
                active: 'Y',
                [Op.or]: [
                    { date : formattedToday, time : ArrayTimes.beforeMidnight},
                    { date : formattedTomorrow, time : ArrayTimes.afterMidnight}
                ],
                '$notifications.reminder_id$' : null
            }
        }).then(resultData =>{

            if(resultData && resultData.length !== 0){
                let idx = 0;
                resultData.forEach(reminder =>{
                    let DateTZ = moment(new Date());
                    let data = {
                        data: {
                            agent_id: reminder.agent_id,
                            Date_Time: reminder.date + ' '+reminder.time,
                            note: reminder.note,
                            callfile_id: reminder.callfile_id
                        },
                        reminder_id : reminder.reminder_id,
                        status: 'Y',
                        created_at: DateTZ,
                        updated_at: DateTZ
                    }
                    let modalObj = this.db['notifications'].build(data);
                    modalObj.save().then(() => {
                        appSocket.emit('save_notification', {
                            target : 'reminder',
                            agent_id : reminder.agent_id,
                        });
                        if(idx < resultData.length -1){
                            idx++;
                        }else{
                            res.send({
                                success :true,
                                message : resultData.length + 'Reminders Added to Notifications !'
                            })
                        }
                    })
                })
            }else{
                res.send({
                    success :true,
                    message : "Nothing To Add !"
                })
            }
        }).catch(err => res.send(err))
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
                                    totalCallFiles += result.data.total || 0;
                                    totalTreated += result.data.totalTreated || 0;
                                    if (idx < LCF_ids.length - 1) {
                                        idx++
                                    } else {
                                        if(totalCallFiles !== 0){
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
                                                                target : 'call_file',
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
                                        } else{
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
                                                target : 'call_file',
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
        if (!!!params.target) {
            return this.sendResponseError(res, ['Error.Target is Required'], 1, 403);
        }
        if(params.target === 'reminder' && !!!params.agent_id){
            return this.sendResponseError(res, ['Error.Agent_id is Required'], 1, 403);
        }

        if(params.target === 'call_file' && !!!params.account_id){
            return this.sendResponseError(res, ['Error.Agent_id is Required'], 1, 403);
        }
        let whereClause = {
            active: 'Y',
        }
        if(params.target === 'call_file'){
            whereClause['account_id'] = params.account_id;
        }else if(params.target === 'reminder'){
            whereClause['data'] = {
                [Op.contains]: {
                    agent_id: params.agent_id
                }
            };
            whereClause['reminder_id'] = {
                [Op.not]: null
            }
        }
        if (!!!!params.status) {
            whereClause['status'] = "Y";
        }
        const limit = parseInt(params.limit) > 0 ? params.limit : 1000;

        switch(params.target){
            case 'reminder' : this.db['notifications'].findAll({
                where : whereClause,
                order: [['created_at', 'DESC']]
            }).then(resultReminder =>{
                let CountUnreadMessagesReminder = 0;
                let UnreadMessagesReminder = [];
                let dataCountAllUnreadReminder = [];
                let CountAllNotificationsReminder = resultReminder.length;
                if (CountAllNotificationsReminder !== 0) {
                    UnreadMessagesReminder = resultReminder.filter(notif => notif.status === 'Y');
                    CountUnreadMessagesReminder = UnreadMessagesReminder.length;
                    resultReminder = resultReminder.slice(0, parseInt(limit));
                    dataCountAllUnreadReminder = UnreadMessagesReminder.slice(0, parseInt(limit));
                }
                let data = {
                    success: true,
                    status: 200,
                    data: !!!!params.status ? dataCountAllUnreadReminder : resultReminder,
                    count: {
                        all: CountAllNotificationsReminder,
                        unread: CountUnreadMessagesReminder
                    }
                }
                res.send(data)

            }).catch(err => res.send(err));break;
            case 'call_file' :this.db['campaigns'].findAll({where: {account_id: params.account_id, active: "Y"}}).then(campaigns => {
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
            });break;
        }

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
