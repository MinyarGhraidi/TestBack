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
const efilesBo = require('./efilesbo');
const moment = require("moment");
const Op = require("sequelize/lib/operators");
const rabbitmq_url = appHelper.rabbitmq_url;
const app_config = require("../helpers/app").appConfig;
const _efilebo = new efilesBo;
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
        let campaign_id = req.body.callFiles_options.data_listCallFileItem.campaign_id;
        let check_duplication = req.body.callFiles_options.data_listCallFileItem.check_duplication
        let attribute_phone_number = req.body.attribute_phone_number
        let list_call_file_id = listCallFileItem.listcallfile_id;
        let custom_fields_list_call_file=req.body.custom_fields
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
        let custom_field = []
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
                        resolve({
                            dataMapping: dataMapping,
                            custom_field: custom_field
                        })
                    }
                })
            } else {
                dataMapping = listCallFileItem.mapping;
                custom_field =custom_fields_list_call_file;
                resolve({
                    dataMapping: dataMapping,
                    custom_field: custom_field
                })
            }
        })

        Promise.all([PromiseMapping]).then(dataMapping => {
            this.CreateCallFileItem(dataMapping[0].dataMapping, listCallFileItem, basic_fields, callFile, item_callFile, indexMapping).then(callFile => {
                key++;
                this.saveCustomField(dataMapping[0].custom_field,listCallFileItem,callFile, item_callFile).then(customField=>{
                    callFile.customfields = customField.customfields;
                    callFile.created_at = new Date();
                    callFile.updated_at = new Date();
                    this.checkDuplicationListCallFile(item_callFile, check_duplication, campaign_id, attribute_phone_number, list_call_file_id).then(check_duplication => {
                        if (check_duplication) {
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
                        } else {
                            res.send({
                                success: true,
                                message: 'phone number exist',
                            })
                        }
                    }).catch(err => {
                        res.send(err);
                    })
                }).catch(err => {
                    res.send(err);
                });
            }).catch(err => {
                res.send(err);
            });
        })
    }

    CreateCallFileItem = (dataMapping, listCallFileItem, basic_fields, callFile, item_callFile, indexMapping , customFields) => {
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
        let user_id = req.body.user_id;
        let attribute_phone_number = req.body.phone_number;
        let custom_fields=[]
        if(req.body.custom_field){
             custom_fields = req.body.custom_field;
        }
        let CallFile = req.body;
        CallFile.created_at = moment(new Date());
        CallFile.updated_at = moment(new Date());
        delete CallFile.phone_number;
        delete CallFile.user_id;
        if(req.body.custom_field){
            delete CallFile.custom_field;
        }
        this.db['listcallfiles'].build(CallFile).save().then(save_list => {
            this.LoadCallFile(save_list.listcallfile_id, user_id, attribute_phone_number,custom_fields).then(result => {
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
                return this.sendResponseError(res, ['Error', err], 1, 403);
            })
        }).catch(err => {
            return this.sendResponseError(res, ['Error', err], 1, 403);
        })
    }

    LoadCallFile = (listcallfile_id, user_id, attribute_phone_number,custom_fields) => {
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
                    _this.CallFilesInfo(res_listCallFile, params, user_id, attribute_phone_number,custom_fields).then(callFilesMapping => {
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

    CallFilesInfo = (res_listCallFile, params, user_id, attribute_phone_number,custom_fields) => {
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
                                this.sendDataToQueue(callFiles, campaign, data_listCallFileItem, listcallfile_item_to_update, user_id, attribute_phone_number,custom_fields).then(send_callFile => {
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

    sendDataToQueue(callFiles, campaign, data_listCallFileItem, listcallfile_item_to_update, user_id, attribute_phone_number,custom_fields) {
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
                    const queue = app_config.rabbitmq.queues.addCallFiles + user_id;
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
                        data_call.user_id = user_id;
                        data_call.attribute_phone_number = attribute_phone_number;
                        if(custom_fields && custom_fields.length !== 0){
                            data_call.custom_fields = custom_fields

                        }
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
        this.db['callfiles'].findOne({
            where:{
                callfile_id: callfile_id
            }
        }).then(call_previous=>{
           let obj = call_previous.dataValues
            Object.entries(obj).map(item=>{
                let index = Object.entries(req.body).findIndex(element=> element[0]=== item[0])
                if (index === -1){
                    delete obj[item[0]]
                }
            })
            this.saveEntityNewRevision(req.body,obj,req).then(revision=>{
                this.db['callfiles'].update(req.body,
                    {
                        where: {
                            callfile_id: callfile_id
                        }
                    }).then(result => {
                        if(result){
                            res.send({
                                success: true,
                                revision_id: revision.id? revision.id: null
                            })
                        }

                }).catch(err => {
                    return this.sendResponseError(res, ['Error', err], 1, 403);
                })
            })
        })


    }

    leadsStats(req, res, next) {
        let _this = this;
        let data = req.body;
        const limit = parseInt(data.limit) > 0 ? data.limit : 1000;
        const offset = data.limit * (data.pages - 1) || 0
        if(!!!data.filter){
            res.send({
                success: false,
                status: 403,
                data: [],
                message: 'Cannot get filter'
            })
        }
        let {
            listCallFiles_ids,
            call_status,
            dateSelected_from,
            startTime,
            endTime,
            dateSelected_to,
            campaign_ids,
            phone_number,
            } = data.filter;
        let sqlListCallFiles = `select listcallfile_id from listcallfiles
                                       where EXTRA_WHERE and active = 'Y' and status = 'Y'`

        let sqlLeads = `Select distinct callF.*, calls_h.finished_at
                        from callfiles as callF
                                 left join calls_historys as calls_h on callF.callfile_id = calls_h.call_file_id
                        where calls_h.active = :active
                          and callF.active = :active
                           EXTRA_WHERE 
                           order by calls_h.finished_at desc LIMIT :limit OFFSET :offset
                         `
        let sqlLeadsCount = `Select count(distinct callF.*)
                        from callfiles as callF
                                 left join calls_historys as calls_h on callF.callfile_id = calls_h.call_file_id
                        where calls_h.active = :active
                          and callF.active = :active
                           EXTRA_WHERE 
                         `
        let extra_where = '';
        let extra_where_ListCallFile = '';
        if(listCallFiles_ids && listCallFiles_ids.length === 0){
            extra_where_ListCallFile = " campaign_id in (:campaign_ids) ";
        }else{
            extra_where_ListCallFile = " listcallfile_id in (:listCallFiles_ids) ";
            extra_where = "AND callF.listcallfile_id in (:listCallFiles_ids) ";
        }
        if (startTime && startTime !== '') {
            extra_where += ' AND calls_h.started_at >= :start_time';
        }
        if (endTime && endTime !== '') {
            extra_where += ' AND calls_h.finished_at <=  :end_time';
        }
        if(phone_number && phone_number!== ''){
            extra_where += ' AND phone_number = :phone_number '
        }
        if(call_status && call_status.length !== 0){
            extra_where += ' AND call_status in (:call_status) '
        }
        //extra_where += ' AND listcallfile_id in (:listCallFiles_ids)'
        sqlLeads = sqlLeads.replace('EXTRA_WHERE', extra_where);
        sqlLeadsCount = sqlLeadsCount.replace('EXTRA_WHERE', extra_where);
        sqlListCallFiles = sqlListCallFiles.replace('EXTRA_WHERE', extra_where_ListCallFile);
        db.sequelize['crm-app'].query(sqlListCallFiles,{
            type: db.sequelize['crm-app'].QueryTypes.SELECT,
            replacements: {
                campaign_ids: campaign_ids,
                listCallFiles_ids : listCallFiles_ids
            }
        }).then(list_call_file=>{
            if(list_call_file && list_call_file.length !== 0){
                let lCF_ids = list_call_file.map((item)=> item.listcallfile_id);
                db.sequelize['crm-app'].query(sqlLeadsCount, {
                    type: db.sequelize['crm-app'].QueryTypes.SELECT,
                    replacements: {
                        start_time: moment(dateSelected_from).format('YYYY-MM-DD').concat(' ', startTime),
                        end_time: moment(dateSelected_to).format('YYYY-MM-DD').concat(' ', endTime),
                        listCallFiles_ids: lCF_ids,
                        active: 'Y',
                        phone_number : phone_number,
                        call_status : call_status
                    }
                }).then(countAll => {
                    extra_where += ' AND list_call_file_id in (:listCallFiles_ids)'
                    let pages = Math.ceil(countAll[0].count / data.limit);
                    db.sequelize['crm-app'].query(sqlLeads, {
                        type: db.sequelize['crm-app'].QueryTypes.SELECT,
                        replacements: {
                            start_time: moment(dateSelected_from).format('YYYY-MM-DD').concat(' ', startTime),
                            end_time: moment(dateSelected_to).format('YYYY-MM-DD').concat(' ', endTime),
                            listCallFiles_ids: lCF_ids,
                            active: 'Y',
                            limit: limit,
                            offset: offset,
                            phone_number : phone_number,
                            call_status : call_status
                        }
                    }).then(dataLeads => {
                        const attributes_res = {
                            count: countAll,
                            offset: offset,
                            limit: limit,
                            pages: pages
                        };
                        res.send({
                            success: true,
                            status: 200,
                            data: dataLeads,
                            attributes: attributes_res
                        })
                    }).catch(err => {
                        _this.sendResponseError(res, ['Error stats'], err)
                    })
                }).catch(err => {
                    _this.sendResponseError(res, ['Error stats'], err)
                })
            }else{
                res.send({
                    success: true,
                    status: 200,
                    data: [],
                    message: 'no call file history'
                })
            }
        }).catch(err => {
            _this.sendResponseError(res, ['Error stats'], err)
        })

    }
    changeCustomFields(customField) {
        return new Promise((resolve, reject) => {
            if(Array.isArray(customField)){
                if (customField && customField.length !== 0) {
                    let resData = {};
                    customField.forEach(item => {
                        resData[item.value] = item.default || (item.options ? item.options[0].text : 'empty' ) ;
                    })
                    resolve(resData)
                } else {
                    resolve({})
                }
            }else{
                if (customField) {
                    let resData = {};
                    Object.values(customField).forEach(function(item) {
                        resData[item.value] = item.default || (item.options ? item.options[0].text : 'empty' );
                    });
                    resolve(resData)
                } else {
                    resolve({})
                }
            }

        })
    }

    changeFieldBeforeAfter(_beforeChanges, _afterChanges, _changesDone) {
        return new Promise((resolve, reject) => {
            const KeysToDelete = ['callfile_id', 'updated_at','created_at']
            const beforeChanges = new Promise((resolve, reject) => {
                let before = _beforeChanges;
                let customFields = [];
                if (before.hasOwnProperty('customfields')) {
                    customFields = before.customfields;
                    delete before.customfields;
                    this.changeCustomFields(customFields).then(resCustomFields => {
                        let MergeCustomFields = {...before, ...resCustomFields};
                        KeysToDelete.forEach(e=> delete MergeCustomFields[e])
                        resolve(MergeCustomFields)
                    }).catch(err => reject(err))
                }else{
                    KeysToDelete.forEach(e=> delete before[e])
                    resolve(before)
                }
            })
            const afterChanges = new Promise((resolve, reject) => {
                let after = _afterChanges;
                let customFields = [];
                if (after.hasOwnProperty('customfields')) {
                    customFields = after.customfields;
                    delete after.customfields;
                    this.changeCustomFields(customFields).then(resCustomFields => {
                        let MergeCustomFields = {...after, ...resCustomFields};
                        KeysToDelete.forEach(e=> delete MergeCustomFields[e])
                        resolve(MergeCustomFields)
                    }).catch(err => reject(err))
                }else{
                    KeysToDelete.forEach(e=> delete after[e])
                    resolve(after)
                }
            })
            const changes = new Promise((resolve, reject) => {
                let changes = _changesDone;
                let customFields = [];
                if (changes.hasOwnProperty('customfields')) {
                    customFields = changes.customfields;
                    delete changes.customfields;
                    this.changeCustomFields(customFields).then(resCustomFields => {
                        let MergeCustomFields = {...changes, ...resCustomFields};
                        KeysToDelete.forEach(e=> delete MergeCustomFields[e])
                        resolve(MergeCustomFields)
                    }).catch(err => reject(err))
                }else{
                    KeysToDelete.forEach(e=> delete changes[e])
                    resolve(changes)
                }
            })
            Promise.all([beforeChanges, afterChanges, changes]).then((data) => {
                resolve(data);
            }).catch((err) => {
                reject(err);
            })
        }).catch(err => reject(err))
    }
    returnRevisonData(callFile){
        return new Promise((resolve,reject)=>{
            let user_data = callFile.user.dataValues;
            let rev_data = callFile.revision;
            if(!!!rev_data ){
                resolve({
                    withRevision : false,
                    user: user_data
                })
            }
            let revision_data = rev_data.dataValues || null;
                this.changeFieldBeforeAfter(revision_data.before,revision_data.after,revision_data.changes).then(result =>{
                        resolve({
                            withRevision : true,
                            before: result[0],
                            after: result[1],
                            changes: result[2],
                            date: moment(revision_data.date).format('YYYY-MM-DD HH:mm:ss'),
                            user: user_data
                        })
                }).catch(err=>{
                    reject(err)
                })
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
            _this.db['calls_historys'].findAll({
                where: {
                    active: 'Y',
                    call_file_id: data.call_file_id
                },
                include: [{
                    model: db.users
                }, {
                    model: db.callfiles
                },{
                    model: db.revisions
                }],
                order: [['started_at', 'DESC']],
            }).then(callFileStats => {
                if(!!!callFileStats){
                    res.send({
                        success: true,
                        status: 200,
                        data: []
                    })
                    return
                }
                let callFileInfo = callFileData.toJSON();
                let statsData = [];
                let idx = 0
                let historyPromise = new Promise((resolve, reject) => {
                    callFileStats.forEach(item_callFile => {
                            let item_callFile_json = item_callFile.toJSON();
                            this.returnRevisonData(item_callFile).then(res_data=>{
                                item_callFile_json.revisionData = res_data
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
                    statsData.sort(
                        (objA, objB) => Number(objB.started_at) - Number(objA.started_at),
                    );
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
    playMediaMusic(req,res,send){
        let {file_id} = req.body;
        if(!!!file_id){
            return this.sendResponseError(res, ['Error.FileIdIsRequired'],1,403);
        }
        _efilebo.checkFile([file_id]).then((result)=>{
            if(result.success){
                fs.readFile(result.data, function (err, data) {
                    res.sendFile(result.data);
                });
            }else{
                this.sendResponseError(res,['Error.CannotFindMedia'],1,403);
            }
        }).catch(err=>{
            this.sendResponseError(res,['Error.CannotCheckMedia'],1,403);
        })
    }

    getCustomFields(req, res, next) {
        let resCustomFields = [];
        let campaign_id = req.body.campaign_id;
        if (!!!campaign_id) {
            this.sendResponseError(res, ['Error.campaignIdRequired'])
            return
        }
        let sql = `select distinct customfields
                   from callfiles
                   where listcallfile_id in (
                       SELECT listcallfile_id FROM public.listcallfiles WHERE campaign_id = :camp_id and active = :active
                   )
                     and customfields <> '{}'`;
        db.sequelize['crm-app'].query(sql, {
            type: db.sequelize['crm-app'].QueryTypes.SELECT,
            replacements: {
                camp_id: campaign_id,
                active: 'Y'
            }
        }).then(customFields => {
            let AllFields = [];
            const Fields = ['first_name', 'last_name', 'phone_number', 'address1', 'city', 'postal_code', 'email', 'country_code'];
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

    fieldCallFile(mapping, call_file) {
        return new Promise((resolve, reject) => {
            let dataField = [];
            let index = 0;
            Object.entries(call_file.dataValues).map(item => {
                let indexField = Object.keys(mapping).findIndex(element => element === item[0])
                if (indexField !== -1) {
                    dataField.push([item[0], item[1]])
                }
                if (index < Object.entries(call_file.dataValues).length - 1) {
                    index++
                } else {
                    resolve({
                        success: true,
                        dataField: dataField
                    })
                }
            })
        })
    }

    creatSchema(dataField, schema) {
        return new Promise((resolve, reject) => {
            let index = 0;
            dataField.map(item => {
                if (item[0] === 'phone_number') {
                    schema.properties[item[0]] = {
                        type: "string",
                        default: item[1],
                        "readOnly": true
                    }
                } else {
                    schema.properties[item[0]] = {
                        type: "string",
                        default: item[1],
                    }
                }

                if (index < dataField.length - 1) {
                    index++
                } else {
                    resolve({
                        success: true,
                        dataSchema: schema
                    })
                }
            })
        })
    }

    createSchemaCustomField(schema, callFile) {
        return new Promise((resolve, reject) => {
            let index = 0;
            callFile.customfields.map(item => {
                if (item.type === 'select') {
                    let obj = []
                    item.options.map(element => {
                        obj.push(element.id)
                    })
                    schema.properties[item.value] = {
                        "enum": obj,
                        "default": item.default
                    }
                } else if (item.type === 'checkbox') {
                    schema.properties[item.value] = {
                        "type": "array",
                        "title": item.value,
                        "items": {
                            "type": "string",
                            "enum": [],
                            "default": item.default
                        },
                        "uniqueItems": true
                    }
                    item.options.map(element => {
                        schema.properties[item.value].items.enum.push(element.id)
                    })

                } else {
                    schema.properties[item.value] = {
                        "title": item.value,
                        "type": "string",
                        "default": item.default
                    }
                }
                if (index < callFile.customfields.length - 1) {
                    index++
                } else {
                    resolve({
                        success: true,
                        schema: schema
                    })
                }
            })
        })
    }

    updateSchemaUischema(schema, uiSchema) {
        return new Promise((resolve, reject) => {
            let index_map = 0
            Object.entries(schema.properties).map((item, index, dataSchema) => {
                let index1 = index === 0 ? index : index * 2
                let index2 = index1 + 1
                let obj = {}
                if (dataSchema[index1] && dataSchema[index2]) {
                    obj[dataSchema[index1][0]] = {sm: 6}
                    obj[dataSchema[index2][0]] = {sm: 6}
                    uiSchema["ui:layout"].push(obj)
                } else if (dataSchema[index1]) {
                    obj[dataSchema[index1][0]] = {sm: 6}
                    uiSchema["ui:layout"].push(obj)
                }

                if (dataSchema[index1] && dataSchema[index1][1].type === 'array') {
                    uiSchema[dataSchema[index1][0]] = {"ui:widget": "checkboxes"}
                } else if (dataSchema[index2] && dataSchema[index2][1].type === 'array') {
                    uiSchema[dataSchema[index2][0]] = {"ui:widget": "checkboxes"}
                }
                if (index_map < Object.entries(schema.properties).length - 1) {
                    index_map++;
                } else {
                    resolve({
                        schema: schema,
                        uiSchema: uiSchema
                    })
                }
            })
        })
    }

    createSchemaUischema(call_file, mapping, schema) {
        return new Promise((resolve, reject) => {
            if (call_file.listcallfile.templates_id !== null) {
                this.db['templates_list_call_files'].findOne({
                    where: {
                        active: 'Y',
                        status: 'Y',
                        templates_list_call_files_id: call_file.listcallfile.templates_id
                    }
                }).then(tempCallFile => {
                    if (tempCallFile) {
                        mapping = tempCallFile.template
                        this.fieldCallFile(mapping, call_file).then(result => {
                            if (result && result.dataField && result.dataField.length !== 0) {
                                this.creatSchema(result.dataField, schema).then(dataInput => {
                                    if (dataInput && dataInput.dataSchema) {
                                        schema = dataInput.dataSchema;
                                        if (call_file.customfields && call_file.customfields.length !== 0) {
                                            this.createSchemaCustomField(schema, call_file).then(InputField => {
                                                if (InputField.success) {
                                                    let uiSchema = {
                                                        'ui:field': 'layout',
                                                        'ui:layout': [],
                                                    }
                                                    this.updateSchemaUischema(schema, uiSchema).then(uischema_data => {
                                                        resolve({
                                                            success: true,
                                                            data: call_file,
                                                            schema: uischema_data.schema,
                                                            uiSchema: uischema_data.uiSchema
                                                        })
                                                    }).catch(err => {
                                                        reject(err)
                                                    })

                                                }
                                            }).catch(err => {
                                                reject(err)
                                            })
                                        } else {
                                            let uiSchema = {
                                                'ui:field': 'layout',
                                                'ui:layout': [],
                                            }
                                            this.updateSchemaUischema(schema, uiSchema).then(uischema_data => {
                                                resolve({
                                                    success: true,
                                                    data: call_file,
                                                    schema: uischema_data.schema,
                                                    uiSchema: uischema_data.uiSchema
                                                })
                                            }).catch(err => {
                                                reject(err)
                                            })
                                        }
                                    }

                                }).catch(err => {
                                    reject(err)
                                })
                            }
                        }).catch(err => {
                            reject(err)
                        })
                    } else {
                        resolve({
                            success: false,
                            message: "Template call file not found"
                        })
                    }
                }).catch(err => {
                    reject(err)
                })
            } else {
                mapping = call_file.listcallfile.mapping
                this.fieldCallFile(mapping, call_file).then(result => {
                    if (result.success) {
                        this.creatSchema(result.dataField, schema).then(dataInput => {
                            if (dataInput.success) {
                                if (call_file.customfields && call_file.customfields.length !== 0 && Object.keys(call_file.customfields).length !== 0) {
                                    this.createSchemaCustomField(schema, call_file).then(InputField => {
                                        if (InputField.success) {
                                            let uiSchema = {
                                                'ui:field': 'layout',
                                                'ui:layout': [],
                                            }
                                            this.updateSchemaUischema(schema, uiSchema).then(uischema_data => {
                                                resolve({
                                                    success: true,
                                                    data: call_file,
                                                    schema: uischema_data.schema,
                                                    uiSchema: uischema_data.uiSchema
                                                })
                                            }).catch(err => {
                                                reject(err)
                                            })
                                        }
                                    })
                                } else {
                                    let uiSchema = {
                                        'ui:field': 'layout',
                                        'ui:layout': [],
                                    }
                                    this.updateSchemaUischema(schema, uiSchema).then(uischema_data => {
                                        resolve({
                                            success: true,
                                            data: call_file,
                                            schema: uischema_data.schema,
                                            uiSchema: uischema_data.uiSchema
                                        })
                                    }).catch(err => {
                                        reject(err)
                                    })
                                }
                            }
                        }).catch(err => {
                            reject(err)
                        })
                    }
                }).catch(err => {
                    reject(err)
                })
            }
        })
    }

    findCalleFileById(req, res, next) {
        let _this = this
        const {call_file_id} = req.params;
        if (!!!call_file_id) {
            return this.sendResponseError(res, ['Error call file id is null'])
        }
        this.db['callfiles'].findOne({
            include: {
                model: db.listcallfiles
            },
            where: {
                callfile_id: call_file_id
            }
        }).then(call_file => {
            if (!!!call_file) {
                return res.send({
                    success: false,
                    message: "call file not found"
                })
            }
            let schema = {
                type: 'object',
                properties: {}
            }
            let mapping = {}
            this.createSchemaUischema(call_file, mapping, schema).then(result => {
                if (result.success) {
                    res.send({
                        success: true,
                        data: call_file,
                        schema: result.schema,
                        uiSchema: result.uiSchema
                    })
                } else {
                    res.send({
                        success: false,
                        message: result.message
                    })
                }
            }).catch(err => {
                return this.sendResponseError(res, ['Error '], err)
            })
        })
    }

    checkDuplicationListCallFile(callFile, check_duplication, campaign_id, attribute_phone, list_call_file_id) {
        return new Promise((resolve, reject) => {
            let phone_number = callFile[attribute_phone]
            if (phone_number) {
                switch (check_duplication) {
                    case  0: {
                        resolve(true)
                        break;
                    }
                    case 1: {
                        this.Check_in_campaign_call_files(campaign_id, phone_number, list_call_file_id).then(result => {
                            if (result) {
                                resolve(true)
                            } else {
                                resolve(false)
                            }
                        }).catch(err => {
                            reject(err)
                        })
                        break;
                    }
                    case 2: {
                        this.Check_in_list_call_file(list_call_file_id, phone_number).then(result => {
                            if (result) {
                                resolve(true)
                            } else {
                                resolve(false)
                            }
                        }).catch(err => {
                            reject(err)
                        })
                        break;
                    }
                }
            } else {
                resolve(false)
            }
        })
    }

    Check_in_campaign_call_files(campaign_id, phone_number, list_call_file_id) {
        return new Promise((resolve, reject) => {
            this.db['listcallfiles'].findAll({
                where: {
                    active: 'Y',
                    status: 'Y',
                    campaign_id: campaign_id,
                    listcallfile_id: {[Op.ne]: list_call_file_id}
                }
            }).then(list_call_files => {
                if (list_call_files && list_call_files.length !== 0) {
                    let data_id = [];
                    list_call_files.map(item => {
                        data_id.push(item.listcallfile_id)
                    })
                    this.db['callfiles'].findOne({
                        where: {
                            listcallfile_id: {[Op.in]: data_id},
                            phone_number: phone_number,
                            active: 'Y'
                        }
                    }).then(call_file => {
                        if (call_file) {
                            resolve(false)
                        } else {
                            resolve(true)
                        }
                    }).catch(err => {
                        reject(err)
                    })
                } else {
                    resolve(true)
                }
            }).catch(err => {
                reject(err)
            })
        })
    }

    Check_in_list_call_file(list_call_file_id, phone_number) {
        return new Promise((resolve, reject) => {
            this.db['callfiles'].findOne({
                where: {
                    listcallfile_id: list_call_file_id,
                    phone_number: phone_number,
                    active: 'Y'
                }
            }).then(call_file => {
                if (call_file) {
                    resolve(false)
                } else {
                    resolve(true)
                }
            }).catch(err => {
                reject(err)
            })
        })
    }

    listCallFileByAccount(account_id) {
        return new Promise((resolve, reject) => {
            this.db['listcallfiles'].findAll({
                where: {
                    active: 'Y',
                    status: 'Y'
                },
                include: [
                    {
                        model: db.campaigns,
                        include: [{
                            model: db.accounts,
                            where: {
                                account_id: account_id
                            }
                        }]
                    }
                ]
            }).then(result => {
                console.log('result', result)
            })
        })
    }

    saveCustomField(customField,listCallFileItem, callFile, item_callFile){
        return new Promise((resolve, reject)=>{
            if(customField && customField.length !==0){
                customField.map(item=>{
                    if(item.type === 'text'){
                        if(item_callFile[item.value] !== undefined){
                            item['default'] = item_callFile[item.value]
                        }else{
                            item['default'] = null
                        }
                    }else{
                        let exist = false;
                        if(item_callFile[item.value] !== undefined){
                            item.options.map(element=>{
                                if(element.id === item_callFile[item.value]){
                                    exist = true
                                }
                            })
                            if(exist === false){
                                item['default'] = item_callFile[item.value];
                                item.options.push({
                                    id:item_callFile[item.value],
                                    text:item_callFile[item.value]
                                })
                            }
                        }else{
                            item['default'] = item_callFile[item.value];
                            item.options.push({
                                id:item_callFile[item.value],
                                text:item_callFile[item.value]
                            })
                        }
                    }
                })

                resolve({
                    customfields : customField
                })
            }else{
                resolve({
                    customfields : []
                })
            }
        })
    }

    RecycleCallFile(req,res,next){
        let {campaign_id,listcallfile_id} = req.body;
        if(!!!campaign_id && !!!listcallfile_id){
            res.send({
                success : false,
                status : 403
            })
        }
        if(campaign_id){
            this.getCallFileIdsByCampaignID(campaign_id).then(CF_ids => {
                this.updateCallFileTreatAndHooper(CF_ids).then(resUpdate =>{
                    if(resUpdate){
                        res.send({
                            success : true,
                            status : 200
                        })
                    }else{
                        res.send({
                            success : false,
                            status : 403
                        })
                    }
                }).catch(err =>{
                    return this.sendResponseError(res,['Error.CannotUpdateCallFileTreatAndHooper',err],1,403);
                })
            }).catch(err =>{
                return this.sendResponseError(res,['Error.CannotGetCallFileIDsByCampaignID',err],1,403);
            })
        }else if(listcallfile_id){
            this.getCallFileIdsByListCallFileID(listcallfile_id).then(CF_ids => {
                this.updateCallFileTreatAndHooper(CF_ids).then(resUpdate =>{
                    if(resUpdate){
                        res.send({
                            success : true,
                            status : 200
                        })
                    }else{
                        res.send({
                            success : false,
                            status : 403
                        })
                    }
                }).catch(err =>{
                    return this.sendResponseError(res,['Error.CannotUpdateCallFileTreatAndHooper',err],1,403);
                })
            }).catch(err =>{
                return this.sendResponseError(res,['Error.CannotGetCallFileIDsByListCallFileID',err],1,403);
            })
        }
    }
    updateCallFileTreatAndHooper(callFile_ids){
        return new Promise((resolve,reject)=>{
            let updateTZ = moment(new Date());
            let toUpdate = {
                updated_at : updateTZ,
                to_treat : 'N',
                save_in_hooper : 'N'
            }
            this.db['callfiles'].update(toUpdate, {
                where: {
                    callfile_id: callFile_ids,
                    active: 'Y'
                }
            }).then(()=>{
                resolve(true)
            }).catch(err => reject(err))
        })
    }
    getCallFileIdsByCampaignID(campaign_id){
        return new Promise((resolve,reject)=>{
            this.db['campaigns'].findOne({where : {campaign_id : campaign_id, active : 'Y'}}).then(campaign =>{
                if(Object.keys(campaign) && Object.keys(campaign).length !== 0){
                    this.db['listcallfiles'].findAll({where : {campaign_id : campaign_id, active : 'Y'}}).then(listcallfiles =>{
                        if(listcallfiles && listcallfiles.length !== 0){
                            let LCF_ids = [];
                            listcallfiles.forEach(LCF => LCF_ids.push(LCF.listcallfile_id));
                            this.db['callfiles'].findAll({where : {listcallfile_id: LCF_ids, active : 'Y'}}).then(callfiles =>{
                                if(callfiles && callfiles.length !== 0) {
                                    let CF_ids = [];
                                    callfiles.forEach(CF => CF_ids.push(CF.callfile_id));
                                    if(CF_ids.length === callfiles.length){
                                        resolve(CF_ids)
                                    }
                                }else{
                                    reject(false)
                                }
                            })
                        }else{
                            reject(false)
                        }
                    }).catch(err=> reject(err))
                }else{
                    reject(false)
                }
            }).catch(err=> reject(err))
        })
    }

    getCallFileIdsByListCallFileID(list_call_file_id){
        return new Promise((resolve,reject)=>{
                    this.db['listcallfiles'].findOne({where : {listcallfile_id : list_call_file_id, active : 'Y'}}).then(listcallfile =>{
                        if(Object.keys(listcallfile) && Object.keys(listcallfile).length !== 0){
                            this.db['callfiles'].findAll({where : {listcallfile_id: list_call_file_id, active : 'Y'}}).then(callfiles =>{
                                if(callfiles && callfiles.length !== 0) {
                                    let CF_ids = [];
                                    callfiles.forEach(CF => CF_ids.push(CF.callfile_id));
                                    if(CF_ids.length === callfiles.length){
                                        resolve(CF_ids)
                                    }
                                }else{
                                    reject(false)
                                }
                            })
                        }else{
                            reject(false)
                        }
                    }).catch(err=> reject(err))
        })
    }

}

module.exports = callfiles;
