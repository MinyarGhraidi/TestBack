const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
const fs = require("fs");
const PromiseBB = require("bluebird");
const xlsx = require("xlsx");
const path = require("path");
const appDir = path.dirname(require.main.filename);
let amqp = require('amqplib/callback_api');
const appHelper = require("../helpers/app");
const {reject, promise} = require("bcrypt/promises");
const moment = require("moment");
const Op = require("sequelize/lib/operators");
const rabbitmq_url = appHelper.rabbitmq_url;
const app_config = require("../helpers/app").appConfig;

class callfiles extends baseModelbo {
    constructor() {
        super('callfiles', 'callfile_id');
        this.baseModal = "callfiles";
        this.primaryKey = 'callfile_id';
    }

    CallFilesMapping = (req, res, next) => {
        let nbr_callFiles = req.body.callFiles_options.nbr_callFiles;
        let listcallfile_item_to_update = req.body.callFiles_options.listcallfile_item_to_update;
        let listCallFileItem = req.body.callFiles_options.data_listCallFileItem;
        let item_callFile = req.body.item_callFile
        let callFile = {};
        callFile.listcallfile_id = listCallFileItem.listcallfile_id;
        callFile.status = 0;
        callFile.customfields = {};
        let basic_fields = [
            'city',
            'email',
            'state',
            'title',
            'address1',
            'address2',
            'address3',
            'province',
            'last_name',
            'first_name',
            'postal_code',
            'country_code',
            'phone_number',
            'middle_initial']
        let indexMapping = 0;
        let key = 0
        let dataMapping = {}
        let custom_field =[]
        let PromiseMapping = new Promise((resolve, reject) => {
            if (listCallFileItem.templates_id) {
                db['templates_list_call_files'].findOne({
                    where: {
                        templates_list_call_files_id: listCallFileItem.templates_id,
                        active: 'Y'
                    }
                }).then(result => {
                    if (result) {
                        dataMapping = result.template
                        custom_field = result.custom_field
                        resolve({dataMapping:dataMapping,
                            custom_field:custom_field})
                    }
                })
            } else {
                dataMapping = listCallFileItem.mapping;
                resolve({dataMapping:dataMapping,
                    custom_field:custom_field})
            }
        })

        Promise.all([PromiseMapping]).then(dataMapping => {
            this.CreateCallFileItem(dataMapping[0].dataMapping, listCallFileItem, basic_fields, callFile, item_callFile, indexMapping).then(callFile => {
                key++;
                callFile.customfields = dataMapping[0].custom_field ? dataMapping[0].custom_field :[]
                this.db['callfiles'].build(callFile).save().then(result => {

                    let item_toUpdate = listcallfile_item_to_update;
                    item_toUpdate.processing_status = {
                        nbr_callfiles: nbr_callFiles,
                        nbr_uploaded_callfiles: key,
                        nbr_duplicated_callfiles: 0
                    };

                    this.db['listcallfiles'].update(item_toUpdate, {
                        where: {
                            listcallfile_id: listCallFileItem.listcallfile_id
                        }
                    }).then(result_list => {
                        res.send({
                            success: true,
                            data: result,
                        })
                    }).catch(err => {
                        res.send(err);
                    });
                }).catch(err => {
                    res.send(err);
                });
            }).catch(err => {
                res.send(err);
            });
        })


    }

    CreateCallFileItem = (dataMapping, listCallFileItem, basic_fields, callFile, item_callFile, indexMapping) => {
        return new Promise((resolve, reject) => {
            Object.entries(dataMapping).forEach(([key, value]) => {
                if (basic_fields.includes(key)) {
                    if (dataMapping[key]) {
                        let fieldName = (dataMapping[key]);
                        if (item_callFile[fieldName] !== undefined) {
                            callFile[key] = item_callFile[fieldName];
                        }

                        if (indexMapping < dataMapping.length - 1) {
                            indexMapping++;
                        } else {
                            resolve(callFile);
                        }
                    } else {
                        if (indexMapping < dataMapping.length - 1) {
                            indexMapping++;
                        } else {
                            resolve(callFile);
                        }
                    }
                } else {

                    if (dataMapping[key]) {
                        let fieldName = (dataMapping[key]);
                        callFile.customfields[key] = item_callFile[fieldName];
                    }
                    if (indexMapping < dataMapping.length - 1) {
                        indexMapping++;
                    } else {
                        resolve(callFile);
                    }
                }
                if (indexMapping < dataMapping.length - 1) {
                    indexMapping++;
                } else {
                    resolve(callFile);
                }
            });
        });
    }

    saveListCallFile = (req, res, next) => {
        let CallFile = req.body;

        this.db['listcallfiles'].build(CallFile).save().then(save_list => {
            this.LoadCallFile(save_list.listcallfile_id).then(result => {
                if (result.success) {
                    res.send({
                        success: true
                    })
                } else {
                    res.send({
                        success: false
                    })
                }

            }).catch(err => {

            })
        }).catch(err => {

        })
    }

    LoadCallFile = (listcallfile_id) => {
        return new PromiseBB((resolve, reject) => {
            let _this = this;
            let params = {};
            params.filter = [{
                operator: 'and',
                conditions: [
                    {
                        field: 'processing',
                        operator: 'eq',
                        value: '1'
                    }
                ]
            }];
            _this.db['listcallfiles'].findOne({
                where: {
                    active: "Y",
                    processing: "1",
                    listcallfile_id: listcallfile_id
                },
            }).then(res_listCallFile => {
                if (res_listCallFile && res_listCallFile.length !== 0) {
                    _this.CallFilesInfo(res_listCallFile, params).then(callFilesMapping => {
                        if (callFilesMapping.success) {
                            resolve({
                                success: true,
                                data: callFilesMapping
                            });
                        }

                    }).catch(err => {
                        reject(err);
                    })
                }
            }).catch(err => {
                reject(err);
            })
        })

    }

    CallFilesInfo = (res_listCallFile, params) => {
        let _this = this;
        return new Promise((resolve, reject) => {
            let data_listCallFileItem = res_listCallFile.toJSON();
            params.filter = [{
                operator: 'and',
                conditions: [
                    {
                        field: 'file_id',
                        operator: 'eq',
                        value: data_listCallFileItem.file_id
                    }
                ]
            }];
            let listcallfile_item_to_update = {};
            listcallfile_item_to_update.processing = 1;
            listcallfile_item_to_update.listcallfile_id = data_listCallFileItem.listcallfile_id;
            _this.db['listcallfiles'].update({
                    processing: 1,
                },
                {
                    where: {
                        listcallfile_id: data_listCallFileItem.listcallfile_id
                    }
                }).then(result => {
                _this.getCallFiles(data_listCallFileItem.file_id).then(callFiles => {
                    let nbr_callFiles = callFiles ? callFiles.length : 0;
                    let nbr_uploaded_callFiles = 0;
                    let nbr_duplicated_callFiles = 0;
                    listcallfile_item_to_update.processing_status = {
                        nbr_callfiles: nbr_callFiles,
                        nbr_uploaded_callfiles: nbr_uploaded_callFiles,
                        nbr_duplicated_callfiles: nbr_duplicated_callFiles
                    }
                    let indexCallFiles = 0;
                    _this.db['listcallfiles'].update(listcallfile_item_to_update, {
                        where: {
                            listcallfile_id: data_listCallFileItem.listcallfile_id
                        },
                        returning: true,
                        plain: true
                    }).then(result => {
                        if (callFiles && callFiles.length && callFiles.length !== 0) {
                            this.db['campaigns'].findOne({
                                where: {
                                    campaign_id: result[1].campaign_id
                                }
                            }).then(campaign => {
                                this.sendDataToQueue(callFiles, campaign, data_listCallFileItem, listcallfile_item_to_update).then(send_callFile => {
                                    resolve({
                                        send_callFile: send_callFile,
                                        success: true
                                    });
                                }).catch(err => {
                                    reject(err);
                                });
                            }).catch(err => {
                                reject(err);
                            });

                            // _this.CallFilesMapping(callFiles, data_listCallFileItem, nbr_uploaded_callFiles, listcallfile_item_to_update, nbr_duplicated_callFiles, nbr_callFiles, indexCallFiles).then(dataMapping => {
                            //     resolve(dataMapping);
                            // }).catch(err => {
                            //     reject(err);
                            // });
                        }
                    }).catch(err => {
                        reject(err);
                    });
                }).catch(err => {
                    reject(err);
                });
            }).catch(err => {
                reject(err);
            });
        });
    }

    getCallFiles = (file_id) => {
        return new Promise((resolve, reject) => {
            let _this = this;
            let result = [];
            if (parseInt(file_id)) {
                _this.db['efiles'].findOne({
                    where: {
                        active: 'Y',
                        file_id: file_id
                    }
                }).then(efile => {
                    if (efile) {
                        let path = appDir + '/app/resources/efiles' + efile.uri;
                        if (efile.file_extension === 'csv' || efile.file_extension === 'xlsx') {
                            if (fs.existsSync(path)) {
                                const workbook = xlsx.readFile(path);
                                const sheetNames = workbook.SheetNames;
                                const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNames[0]])
                                result = data;
                                resolve(result);
                            } else {
                                resolve(result);
                            }
                        } else {
                            resolve(result);
                        }
                    } else {
                        resolve(result);
                    }
                }).catch(err => {
                    reject(false);
                });
            }
        })
    }

    sendDataToQueue(callFiles, campaign, data_listCallFileItem, listcallfile_item_to_update) {
        return new Promise((resolve, reject) => {
            console.log('rabbitmq_url', rabbitmq_url)
            amqp.connect(rabbitmq_url, function (error0, connection) {
                if (error0) {
                    throw error0;
                }
                connection.createChannel(function (error1, channel) {
                    if (error1) {
                        throw error1;
                    }
                    const queue = app_config.rabbitmq.queues.addCallFiles + campaign.account_id;
                    channel.assertQueue(queue, {
                        durable: true
                    });
                    let data_call = {};
                    let index = 0;

                    PromiseBB.each(callFiles, item => {
                        index++;
                        let progress = Math.round((100 * index) / callFiles.length)
                        data_call.item_callFile = item;
                        data_call.callFiles_options = {
                            data_listCallFileItem: data_listCallFileItem,
                            nbr_callFiles: callFiles ? callFiles.length : 0,
                            listcallfile_item_to_update: listcallfile_item_to_update,
                        };
                        data_call.index = index;
                        data_call.progress = progress;
                        data_call.finish = callFiles.length === index;
                        channel.sendToQueue(queue, Buffer.from(JSON.stringify(data_call)), {type: 'save call file'});
                    }).then((all_r) => {
                        resolve({
                            all_r: all_r,
                            success: true
                        });
                    })
                });
            });
        })
    }

    updateCallFileQualification(req, res, next) {
        let callfile_id = req.body.callfile_id
        let note = req.body.note
        let callStatus = req.body.callStatus

        this.db['callfiles'].update({
            note: note,
            callStatus: callStatus
        }, {
            where: {
                callfile_id: callfile_id
            }
        }).then(result => {
            res.send({
                success: true
            })
        }).catch(err => {
            return this.sendResponseError(res, ['Error', err], 1, 403);
        })
    }

    leadsStats(req, res, next) {
        let _this = this;
        let filter = req.body;
        const limit = parseInt(filter.limit) > 0 ? filter.limit : 1000;
        const page = filter.page || 1;
        const offset = (limit * (page - 1));
        let {start_time, end_time, listCallFiles_ids, date} = filter
        let sqlLeads = `Select distinct  callF.* from callfiles as callF
                        left join calls_historys as calls_h on callF.callfile_id = calls_h.call_file_id
                        where calls_h.active = :active
                               and callF.active = :active
                               and  callF.callfile_id ='103945'
                         EXTRA_WHERE 
                         LIMIT :limit
                         OFFSET :offset`
        let sqlCount = `select count(*)
                            from calls_historys as calls_h
                                WHERE active= :active
                                and  calls_h.call_file_id ='103945'
                                EXTRA_WHERE`
        let extra_where_count = '';
        let extra_where = '';

        if (start_time && start_time !== '') {
            extra_where_count += ' AND started_at >= :start_time';
            extra_where += ' AND started_at >= :start_time';
        }
        if (end_time && end_time !== '') {
            extra_where_count += ' AND finished_at <=  :end_time';
            extra_where += ' AND finished_at <=  :end_time';
        }
        if (listCallFiles_ids && listCallFiles_ids.length !== 0) {
            extra_where_count += ' AND list_call_file_id in (:listCallFiles_ids)';
            extra_where += ' AND list_call_file_id in (:listCallFiles_ids)';
        }
        sqlCount = sqlCount.replace('EXTRA_WHERE', extra_where_count);
        sqlLeads = sqlLeads.replace('EXTRA_WHERE', extra_where);
        db.sequelize['crm-app'].query(sqlCount, {
            type: db.sequelize['crm-app'].QueryTypes.SELECT,
            replacements: {
                date: parseInt(date),
                start_time: moment(date).format('YYYY-MM-DD').concat(' ', start_time),
                end_time: moment(date).format('YYYY-MM-DD').concat(' ', end_time),
                listCallFiles_ids: listCallFiles_ids,
                active: 'Y'
            }
        }).then(countAll => {
            let pages = Math.ceil(countAll[0].count / filter.limit);
            db.sequelize['crm-app'].query(sqlLeads, {
                type: db.sequelize['crm-app'].QueryTypes.SELECT,
                replacements: {
                    date: parseInt(date),
                    start_time: moment(date).format('YYYY-MM-DD').concat(' ', start_time),
                    end_time: moment(date).format('YYYY-MM-DD').concat(' ', end_time),
                    listCallFiles_ids: listCallFiles_ids,
                    active: 'Y',
                    limit: limit,
                    offset: offset
                }
            }).then(dataLeads => {
                res.send({
                    success: true,
                    status: 200,
                    data: dataLeads,
                    pages: pages
                })
            }).catch(err => {
                _this.sendResponseError(res, ['Error stats'], err)
            })
        }).catch(err => {
            _this.sendResponseError(res, ['Error stats'], err)
        })
    }

    getHistoryCallFile(req, res, next) {
        let _this = this;
        let data = req.body;

        if (!!!data || !!!data.call_file_id) {
            _this.sendResponseError(res, ['Error.callFileIdRequired'])
            return
        }
        _this.db['callfiles'].findOne({
            where: {
                active: 'Y',
                callfile_id: data.call_file_id
            }
        }).then(callFileData => {
            if (!!!callFileData) {
                res.send({
                    success: true,
                    status: 200,
                    data: null
                })
                return
            }
            let sqlDetails = `select * from calls_historys  as call_h 
                                left join users as u On u.user_id = call_h.agent_id
                                left join callfiles as callF On callF.callfile_id = call_h.call_file_id
                                where call_h.call_file_id =:call_file_id and call_h.active= :active`
            _this.db['calls_historys'].findAll({
                where: {
                    active: 'Y',
                    call_file_id: data.call_file_id
                },
                include: [{
                    model: db.users
                }, {
                    model: db.callfiles
                }],
                order: [['started_at', 'DESC']],
            }).then(callFileStats => {
                let callFileInfo = callFileData.toJSON();
                let statsData = [];
                let idx = 0
                let historyPromise = new Promise((resolve, reject) => {
                    callFileStats.forEach(item_callFile => {
                        _this.getEntityRevisionByItem(2, 'dialplan_items').then(data_revision => {
                            let item_callFile_json = item_callFile.toJSON();
                            let data = [];
                            data_revision.forEach((item_revision, idx) => {
                                data.push({
                                    key: idx,
                                    before: item_revision.before,
                                    after: item_revision.after,
                                    changes: item_revision.changes,
                                    date: moment(item_revision.date).format('YYYY-MM-DD HH:mm:ss'),
                                    user: item_revision.user
                                })
                            });
                            item_callFile_json.revisionData = data
                            statsData.push(item_callFile_json)
                            if (idx < callFileStats.length - 1) {
                                idx++
                            } else {
                                resolve(statsData)
                            }
                        }).catch(err => {
                            reject(err)
                        })
                    })
                })
                Promise.all([historyPromise]).then(data_stats => {
                   callFileInfo.stats = statsData;
                    res.send({
                        success: true,
                        status: 200,
                        data: callFileInfo,
                    })
                }).catch(err => {
                    _this.sendResponseError(res, ['Error.getStats'], err)
                })
            }).catch(err => {
                _this.sendResponseError(res, ['Error.getFileData'], err)
            })
        })
    }
    getEntityRevisionByItem(model_id, model_name) {
        let _this = this;
        return new Promise((resolve, reject) => {
            _this.db['revisions'].findAll({
                where: {
                    model_id: model_id,
                    model_name: model_name,
                    active: 'Y'
                },
                order: [['date', 'DESC']],
                include: [{
                    model: _this.db['users']
                }]

            }).then((data) => {
                resolve(data)
            }).catch(err => {
                reject(err)
            })
        })
    }
    playMedia(req, res, next) {
        let filePath = appDir + '/app/sub-apps/records/speech.wav'
         fs.readFile(filePath,function (err,data) {
        res.sendFile(filePath);
        });
    }

    getCustomFields(req, res, next) {
        let resCustomFields = [];
        let campaign_id = req.body.campaign_id;
        if (!!!campaign_id) {
            this.sendResponseError(res, ['Error.campaignIdRequired'])
            return
        }
        let sql = `select distinct customfields  from callfiles where listcallfile_id in (
                    SELECT listcallfile_id FROM public.listcallfiles WHERE campaign_id = :camp_id and active= :active
                    ) and customfields <>'{}'`;
        db.sequelize['crm-app'].query(sql, {
            type: db.sequelize['crm-app'].QueryTypes.SELECT,
            replacements: {
                camp_id: campaign_id,
                active: 'Y'
            }
        }).then(customFields => {
            let AllFields = [];
            const Fields = ['first_name', 'last_name','phone_number','address1','city','postal_code','email','country_code'];
            if (customFields.length === 0) {
                res.send({
                    success: true,
                    status: 200,
                    data: Fields
                })
                return
            }
            customFields.map((field) => {
                resCustomFields.push(field.customfields);
            })
            let result = Object.keys(Object.assign({}, ...resCustomFields));
            AllFields = Fields.concat(result);
            res.send({
                success: true,
                status: 200,
                data: AllFields
            })
        }).catch(err => {
            this.sendResponseError(res, ['Error Cannot get CustomFields'], err)
        })
    }
}

module.exports = callfiles;
