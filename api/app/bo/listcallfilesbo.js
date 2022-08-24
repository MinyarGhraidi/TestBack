const {baseModelbo} = require('./basebo');
let db = require('../models');
const amqp = require('amqplib/callback_api');
const appHelper = require("../helpers/app");
const app_config = appHelper.appConfig;
const rabbitmq_url = appHelper.rabbitmq_url;
const PromiseBB = require('bluebird');
const appSocket = new (require('../providers/AppSocket'))();
const moment = require('moment');
const {reject} = require("bcrypt/promises");

class listcallfiles extends baseModelbo {
    constructor() {
        super('listcallfiles', 'listcallfile_id');
        this.baseModal = "listcallfiles";
        this.primaryKey = 'listcallfile_id';
    }

    getStatsListCallFiles(req, res, next) {
        let _this = this;
        let sqlStats = `SELECT listCallf.listcallfile_id as id,count(callf.*) as total, count(case when callf.to_treat = 'Y' then 1 else null end) as total_called, count(case when callf.to_treat = 'N' then 1 else null end)  as total_available    from  public.listcallfiles as listCallf
                        LEFT JOIN callfiles as callf on callf.listcallfile_id = listCallf.listcallfile_id and callf.active='Y' 
                        WHERE listCallf.active= 'Y' 
                          GROUP  by listCallf.listcallfile_id 
                          ORDER by listCallf.listcallfile_id desc`
        db.sequelize.query(sqlStats,
            {
                type: db.sequelize.QueryTypes.SELECT,
            })
            .then(statsListCallFiles => {
                res.send({
                    data: statsListCallFiles,
                    status: 200,
                    success: true
                })
            }).catch(err => {
            _this.sendResponseError(res, ['Error get stats callFiles'], err)
        })
    }

    getStatsListCallFileCallStatus(req, res, next) {
        let _this = this;
        let {listCallfile_id} = req.body
        if (!!!listCallfile_id) {
            _this.sendResponseError(res, ['Error.listCallFile_id is required'])
            return
        }
        _this.getStatsCallStatusByLisCallFile(listCallfile_id).then(data_stats => {
            res.send({
                data: data_stats,
                status: 200,
                success: true
            })
        }).catch(err => {
            _this.sendResponseError(res, ['Error get stats callFiles by callStatus'], err)
        })
    }

    getStatsListCallFileCallStatusCampaign(req, res, next) {
        let _this = this;
        let {campaign_id} = req.body
        if (!!!campaign_id) {
            _this.sendResponseError(res, ['Error.campaign_id is required'])
            return
        }

        let sql_stats = `select callstatuses.code, 
                              CASE all_s.count_call_status 
                               WHEN null THEN 0
                               ELSE all_s.count_call_status
                              END
                        from callstatuses left join (
                           SELECT code,
                                count(call_f.*) as count_call_status
                                FROM callstatuses as call_s
                        LEFT JOIN callfiles as call_f on call_f.call_status = call_s.code and call_f.to_treat = :active and call_f.active= :active  
                        LEFT JOIN listcallfiles as list_call_f on list_call_f.listcallfile_id = call_f.listcallfile_id and list_call_f.active = 'Y' and call_f.active= :active
                        LEFT JOIN campaigns as camp on camp.campaign_id = list_call_f.campaign_id and camp.active = :active 
                        WHERE call_s.active = 'Y' and camp.campaign_id= :campaign_id
                        GROUP by code) as all_s on all_s.code  = callstatuses.code`
        db.sequelize.query(sql_stats,
            {
                type: db.sequelize.QueryTypes.SELECT,
                replacements: {
                    campaign_id: campaign_id,
                    active: 'Y',
                }
            })
            .then(statsListCallFiles => {
                res.send({
                    success: true,
                    data: statsListCallFiles
                })
            }).catch(err => {
            _this.sendResponseError(res, ['Error get stats callFiles by callStatus'], err)
        })
    }

    getStatsCallStatusByLisCallFile(listCallfile_id) {
        return new Promise((resolve, reject) => {
            let sqlStats = `SELECT code, count(call_f.*) as count_call_status
                        FROM callstatuses as call_s
                        LEFT JOIN callfiles as call_f on call_f.call_status = call_s.code and call_f.to_treat = :active and call_f.active= :active  and call_f.listcallfile_id = :listCallfile_id
                        WHERE call_s.active = :active   
                        GROUP by code`
            db.sequelize.query(sqlStats,
                {
                    type: db.sequelize.QueryTypes.SELECT,
                    replacements: {
                        listCallfile_id: listCallfile_id,
                        active: 'Y',
                    }
                })
                .then(statsListCallFiles => {
                    resolve(statsListCallFiles)
                }).catch(err => {
                reject(err)
            })
        })
    }

    cloneListCallFiles = (req, res, next) => {
        let _this = this;
        let {listCallFile_id, listCallFile_name, account_id, campaign_id} = req.body;

        if (!listCallFile_id) {
            _this.sendResponseError(res, 'invalid source list call file')
        }
        if (!listCallFile_name) {
            _this.sendResponseError(res, ['invalid source listCallFile name'])
        }

        _this.db['listcallfiles'].findOne({
            where: {
                listcallfile_id: listCallFile_id
            }

        }).then(listcallfile => {
            if (listcallfile) {
                let data_listCallFile_gp = listcallfile.toJSON();
                data_listCallFile_gp.name = listCallFile_name;
                data_listCallFile_gp.campaign_id = campaign_id;
                data_listCallFile_gp.createdAt = moment.unix(moment().unix()).format("YYYY-MM-DD HH:mm:ss");
                data_listCallFile_gp.updatedAt = null
                delete data_listCallFile_gp['listcallfile_id'];
                const ListCallFileModel = db['listcallfiles'];
                let list_CallFile = ListCallFileModel.build(data_listCallFile_gp);
                list_CallFile.save(data_listCallFile_gp).then(list_CallFile_saved => {
                    _this.db['callfiles'].findAll({
                        where: {
                            listcallfile_id: listCallFile_id,
                        }
                    }).then(callFiles_items => {
                        _this.pushItemsToQueue(callFiles_items, list_CallFile_saved.listcallfile_id, listcallfile, listCallFile_name, account_id).then(items => {
                            res.send({
                                success: true,
                                data: items
                            })
                        })
                    }).catch(err => {
                        _this.sendResponseError(res, err)
                    })
                }).catch(err => {
                    _this.sendResponseError(res, err)
                })
            } else {
                res.send({
                    success: true,
                    data: [],
                    message: 'rate group not found'
                })
            }

        })

    }

    pushItemsToQueue = (callFiles_items, listcallfile_id, cloned_listcallfile, listCallFile_name, account_id) => {
        let _this = this;
        return new Promise((resolve, reject) => {
            if (callFiles_items.length !== 0) {
                amqp.connect(rabbitmq_url, function (error0, connection) {
                    if (error0) {
                        throw error0;
                    }
                    connection.createChannel(function (error1, channel) {
                        if (error1) {
                            throw error1;
                        }
                        const queue = app_config.rabbitmq.queues.clone_List_CallFiles + account_id;
                        ;
                        channel.assertQueue(queue, {
                            durable: true
                        });
                        let index = 1;
                        PromiseBB.each(callFiles_items, item => {
                            let current_callFile = item.toJSON();
                            delete current_callFile['callfile_id']
                            current_callFile.listcallfile_id = listcallfile_id
                            current_callFile.total_callFiles = callFiles_items.length;
                            current_callFile.current_callFile = index;
                            current_callFile.source_listCallFile = cloned_listcallfile.name;
                            current_callFile.listCallFile_name = listCallFile_name
                            current_callFile.callFiles_options = listCallFile_name
                            current_callFile.to_treat = 'N'
                            current_callFile.save_in_hooper = 'N'
                            index++;
                            channel.sendToQueue(queue, Buffer.from(JSON.stringify(current_callFile)), {type: 'clone listCallFile'});
                        }).then((all_r) => {
                            resolve(all_r);
                        })
                    });
                });
            } else {
                reject(false);
            }
        })
    }

    orderEmitSocket(rate, action, key, total, cloned_name, rate_group_name_save) {
        appSocket.emit('rate.clone', {
            action: action,
            last_clone_user_id: rate.last_clone_user_id,
            rate_group_id: rate.rate_group_id,
            rate: rate,
            total: total,
            current_rate: key,
            cloned_name: cloned_name,
            saved_name: rate_group_name_save
        });
    }
}

module.exports = listcallfiles;
