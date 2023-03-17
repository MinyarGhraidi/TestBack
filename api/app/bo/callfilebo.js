const {baseModelbo} = require('./basebo');
let db = require('../models');
const fs = require("fs");
const {reject} = require("bcrypt/promises");
const efilesBo = require('./efilesbo');
const moment = require("moment");
const _efilebo = new efilesBo;
const request = require('request');

class callfiles extends baseModelbo {
    constructor() {
        super('callfiles', 'callfile_id');
        this.baseModal = "callfiles";
        this.primaryKey = 'callfile_id';
    }

    _updateCallFileQualification(callfile_id,body,req){
        return new Promise((resolve,reject)=> {
            this.db['callfiles'].findOne({
                where: {
                    callfile_id: callfile_id
                }
            }).then(call_previous => {
                if(call_previous){
                    this.db['callfiles'].update(body,
                        {
                            where: {
                                callfile_id: callfile_id
                            },
                            returning: true,
                            plain: true
                        }).then(result => {
                        if(result){
                            let obj = call_previous.dataValues
                            Object.entries(obj).map(item => {

                                let index = Object.entries(body).findIndex(element => element[0] === item[0])
                                if (index === -1) {
                                    delete obj[item[0]]
                                }
                                if (item[0] === 'customfields') {
                                    item[1].map(field => {
                                        obj[field.value] = field.default
                                    })
                                }
                            })
                            let objAfter = body
                            delete objAfter.customfields
                            Object.entries(objAfter).map(element=>{
                                if(Array.isArray(element[1])){
                                    element[1]=element[1].toString()
                                }
                            })
                            delete obj.customfields
                            this.saveEntityNewRevision(objAfter, obj, req).then(revision => {
                                resolve({
                                    success: true,
                                    revision_id: revision.id ? revision.id : null
                                })
                            }).catch(err => {
                                reject(err)
                            })
                        }else{
                           resolve({
                               success : false
                           })
                        }

                    }).catch(err => {
                        reject(err)
                    })
                }
                else{
                    resolve({
                        success : false
                    })
                }

            }).catch(err => {
                reject(err)
            })
        })
    }
    updateCallFileQualification(req, res, next) {
        let callfile_id = req.body.callfile_id
        this._updateCallFileQualification(callfile_id,req.body,req).then(result => {
            res.send(result)
        }).catch(err => {
            this.sendResponseError(res,['cannotUpdateCallFile',err],1,403)
        })
    }

    leadsStats(req, res, next) {
        let _this = this;
        let data = req.body;
        const limit = parseInt(data.limit) > 0 ? data.limit : 1000;
        const offset = data.limit * (data.pages - 1) || 0
        if (!!!data.filter) {
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
        if (listCallFiles_ids && listCallFiles_ids.length === 0) {
            extra_where_ListCallFile = " campaign_id in (:campaign_ids) ";
        } else {
            extra_where_ListCallFile = " listcallfile_id in (:listCallFiles_ids) ";
            extra_where = "AND callF.listcallfile_id in (:listCallFiles_ids) ";
        }
        if (startTime && startTime !== '') {
            extra_where += ' AND calls_h.started_at >= :start_time';
        }
        if (endTime && endTime !== '') {
            extra_where += ' AND calls_h.finished_at <=  :end_time';
        }
        if (phone_number && phone_number !== '') {
            extra_where += ' AND phone_number = :phone_number '
        }
        if (call_status && call_status.length !== 0) {
            extra_where += ' AND call_status in (:call_status) '
        }
        //extra_where += ' AND listcallfile_id in (:listCallFiles_ids)'
        sqlLeads = sqlLeads.replace('EXTRA_WHERE', extra_where);
        sqlLeadsCount = sqlLeadsCount.replace('EXTRA_WHERE', extra_where);
        sqlListCallFiles = sqlListCallFiles.replace('EXTRA_WHERE', extra_where_ListCallFile);
        db.sequelize['crm-app'].query(sqlListCallFiles, {
            type: db.sequelize['crm-app'].QueryTypes.SELECT,
            replacements: {
                campaign_ids: campaign_ids,
                listCallFiles_ids: listCallFiles_ids
            }
        }).then(list_call_file => {
            if (list_call_file && list_call_file.length !== 0) {
                let lCF_ids = list_call_file.map((item) => item.listcallfile_id);
                db.sequelize['crm-app'].query(sqlLeadsCount, {
                    type: db.sequelize['crm-app'].QueryTypes.SELECT,
                    replacements: {
                        start_time: moment(dateSelected_from).format('YYYY-MM-DD').concat(' ', startTime),
                        end_time: moment(dateSelected_to).format('YYYY-MM-DD').concat(' ', endTime),
                        listCallFiles_ids: lCF_ids,
                        active: 'Y',
                        phone_number: phone_number,
                        call_status: call_status
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
                            phone_number: phone_number,
                            call_status: call_status
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
            } else {
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
            if (Array.isArray(customField)) {
                if (customField && customField.length !== 0) {
                    let resData = {};
                    customField.forEach(item => {
                        resData[item.value] = item.default || (item.options ? item.options[0].text : 'empty');
                    })
                    resolve(resData)
                } else {
                    resolve({})
                }
            } else {
                if (customField) {
                    let resData = {};
                    Object.values(customField).forEach(function (item) {
                        resData[item.value] = item.default || (item.options ? item.options[0].text : 'empty');
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
            const KeysToDelete = ['callfile_id', 'updated_at', 'created_at']
            const beforeChanges = new Promise((resolve, reject) => {
                let before = _beforeChanges;
                let customFields = [];
                if (before.hasOwnProperty('customfields')) {
                    customFields = before.customfields;
                    delete before.customfields;
                    this.changeCustomFields(customFields).then(resCustomFields => {
                        let MergeCustomFields = {...before, ...resCustomFields};
                        KeysToDelete.forEach(e => delete MergeCustomFields[e])
                        resolve(MergeCustomFields)
                    }).catch(err => reject(err))
                } else {
                    KeysToDelete.forEach(e => delete before[e])
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
                        KeysToDelete.forEach(e => delete MergeCustomFields[e])
                        resolve(MergeCustomFields)
                    }).catch(err => reject(err))
                } else {
                    KeysToDelete.forEach(e => delete after[e])
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
                        KeysToDelete.forEach(e => delete MergeCustomFields[e])
                        resolve(MergeCustomFields)
                    }).catch(err => reject(err))
                } else {
                    KeysToDelete.forEach(e => delete changes[e])
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

    returnRevisonData(callFile) {
        return new Promise((resolve, reject) => {
            let user_data = callFile.user.dataValues;
            let rev_data = callFile.revision;
            if (!!!rev_data) {
                resolve({
                    withRevision: false,
                    user: user_data
                })
            }
            let revision_data = rev_data.dataValues || null;
            this.changeFieldBeforeAfter(revision_data.before, revision_data.after, revision_data.changes).then(result => {
                resolve({
                    withRevision: true,
                    before: result[0],
                    after: result[1],
                    changes: result[2],
                    date: moment(revision_data.date).format('YYYY-MM-DD HH:mm:ss'),
                    user: user_data
                })
            }).catch(err => {
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
                }, {
                    model: db.revisions
                }],
                order: [['started_at', 'DESC']],
            }).then(callFileStats => {
                if (!!!callFileStats) {
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
                        this.returnRevisonData(item_callFile).then(res_data => {
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

    playMediaMusic(req, res, send) {
        let {file_id} = req.body;
        if (!!!file_id) {
            return this.sendResponseError(res, ['Error.FileIdIsRequired'], 1, 403);
        }
        _efilebo.checkFile([file_id]).then((result) => {
            if (result.success) {
                fs.readFile(result.data, function (err, data) {
                    res.sendFile(result.data);
                });
            } else {
                this.sendResponseError(res, ['Error.CannotFindMedia'], 1, 403);
            }
        }).catch(err => {
            this.sendResponseError(res, ['Error.CannotCheckMedia'], 1, 403);
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
                        },
                        "default": [item.default],
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

    RecycleCallFile(req, res, next) {
        let {campaign_id, listcallfile_id} = req.body;
        if (!!!campaign_id && !!!listcallfile_id) {
            res.send({
                success: false,
                status: 403
            })
        }
        if (campaign_id) {
            this.getCallFileIdsByCampaignID(campaign_id).then(result => {
                if (result.success) {
                    this.updateCallFileTreatAndHooper(result.data, result.call_status).then(resUpdate => {
                        if (resUpdate) {
                            res.send({
                                success: true,
                                status: 200,
                                message: 'Campaign Recycled Successfully !'
                            })
                        } else {
                            res.send({
                                success: false,
                                status: 403,
                                message: 'Error, Please Try Again !'
                            })
                        }
                    }).catch(err => {
                        return this.sendResponseError(res, ['Error.CannotUpdateCallFileTreatAndHooper', err], 1, 403);
                    })
                } else {
                    res.send({
                        success: false,
                        status: 403,
                        message: result.message
                    })
                }

            }).catch(err => {
                return this.sendResponseError(res, ['Error.CannotGetCallFileIDsByCampaignID', err], 1, 403);
            })
        } else if (listcallfile_id) {
            this.getCallFileIdsByListCallFileID(listcallfile_id).then(result => {
                if (result.success) {
                    this.updateCallFileTreatAndHooper(result.data, result.call_status).then(resUpdate => {
                        if (resUpdate) {
                            res.send({
                                success: true,
                                status: 200,
                                message: 'List Call File Recycled Successfully !'
                            })
                        } else {
                            res.send({
                                success: false,
                                status: 403,
                                message: 'Error, Please Try Again !'
                            })
                        }
                    }).catch(err => {
                        return this.sendResponseError(res, ['Error.CannotUpdateCallFileTreatAndHooper', err], 1, 403);
                    })
                } else {
                    res.send({
                        success: false,
                        status: 403,
                        message: result.message
                    })
                }
            }).catch(err => {
                return this.sendResponseError(res, ['Error.CannotGetCallFileIDsByListCallFileID', err], 1, 403);
            })
        }
    }

    updateCallFileTreatAndHooper(callFile_ids, call_status) {
        return new Promise((resolve, reject) => {
            let updateTZ = moment(new Date());
            let toUpdate = {
                updated_at: updateTZ,
                to_treat: 'N',
                save_in_hooper: 'N'
            }
            this.db['callfiles'].update(toUpdate, {
                where: {
                    callfile_id: callFile_ids,
                    active: 'Y',
                    call_status: call_status
                }
            }).then(() => {
                resolve(true)
            }).catch(err => reject(err))
        })
    }

    getCallFileIdsByCampaignID(campaign_id) {
        return new Promise((resolve, reject) => {
            this.db['campaigns'].findOne({where: {campaign_id: campaign_id, active: 'Y'}}).then(campaign => {
                if (Object.keys(campaign) && Object.keys(campaign).length !== 0) {
                    this.db['callstatuses'].findAll({
                        where: {
                            active: 'Y',
                            status: 'Y',
                            $or: [
                                {
                                    is_system:
                                        {
                                            $eq: "Y"
                                        }
                                },
                                {
                                    campaign_id: campaign_id,
                                }
                            ]
                        }
                    }).then((res_CS) => {
                        if (res_CS && res_CS.length !== 0) {
                            let Camp_CS_ids = campaign.call_status_ids || [];
                            let CS_data = res_CS.filter(CS => Camp_CS_ids.includes(CS.callstatus_id))
                            let CS_codes = [];
                            CS_data.map(item => {
                                CS_codes.push(item.code);
                            })
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
                                            call_status: CS_codes
                                        }
                                    }).then(callfiles => {
                                        if (callfiles && callfiles.length !== 0) {
                                            let CF_ids = [];
                                            callfiles.forEach(CF => CF_ids.push(CF.callfile_id));
                                            if (CF_ids.length === callfiles.length) {
                                                resolve({
                                                    success: true,
                                                    data: CF_ids,
                                                    call_status: CS_codes,
                                                    message: 'Campaign Recycled Successfully !'
                                                })
                                            }
                                        } else {
                                            resolve({
                                                success: false,
                                                message: 'ListCallFile doesn`t have callfiles !'

                                            })
                                        }
                                    }).catch(err => reject(err))
                                } else {
                                    resolve({
                                        success: false,
                                        message: 'Campaign doesn`t have listcallfiles !'
                                    })
                                }
                            }).catch(err => reject(err))
                        } else {
                            reject(false)
                        }
                    })
                } else {
                    reject(false)
                }
            }).catch(err => reject(err))
        })
    }

    getCallFileIdsByListCallFileID(list_call_file_id) {
        return new Promise((resolve, reject) => {
            this.db['listcallfiles'].findOne({
                where: {
                    listcallfile_id: list_call_file_id,
                    active: 'Y',
                    status: 'Y'
                }
            }).then(listcallfile => {
                if (Object.keys(listcallfile) && Object.keys(listcallfile).length !== 0) {
                    this.db['callstatuses'].findAll({
                        where: {
                            active: 'Y',
                            status: 'Y',
                            $or: [
                                {
                                    is_system:
                                        {
                                            $eq: "Y"
                                        }
                                },
                                {
                                    campaign_id: listcallfile.campaign_id,
                                }
                            ]
                        }
                    }).then((res_CS) => {
                        this.db['campaigns'].findOne({
                            where: {
                                campaign_id: listcallfile.campaign_id,
                                status: 'Y',
                                active: 'Y'
                            }
                        }).then((camp) => {
                            let Camp_CS_ids = camp.call_status_ids || [];
                            let CS_data = res_CS.filter(CS => Camp_CS_ids.includes(CS.callstatus_id))
                            let CS_codes = [];
                            CS_data.map(item => {
                                CS_codes.push(item.code);
                            })
                            this.db['callfiles'].findAll({
                                where: {
                                    listcallfile_id: list_call_file_id,
                                    active: 'Y',
                                    call_status: CS_codes
                                }
                            }).then(callfiles => {
                                if (callfiles && callfiles.length !== 0) {
                                    let CF_ids = [];
                                    callfiles.forEach(CF => CF_ids.push(CF.callfile_id));
                                    if (CF_ids.length === callfiles.length) {
                                        resolve({
                                            success: true,
                                            data: CF_ids,
                                            call_status: CS_codes,
                                            message: 'List Call File Recycled Successfully !'
                                        })
                                    }
                                } else {
                                    resolve({
                                        success: false,
                                        message: 'ListCallFile doesn`t have callfiles !'
                                    })
                                }
                            }).catch(err => reject(err))
                        }).catch(err => reject(err))

                    }).catch(err => reject(err))
                } else {
                    reject(false)
                }
            }).catch(err => reject(err))
        })
    }

    getCallBlending (req, res, next){
        let number = req.body.number;
        if(!!!number){
            return this.sendResponseError(res, ['Error.numberIsNull', ], 1, 403);
        }
        this.db['callfiles'].findOne({
            where:{
                phone_number: number,
                active : 'Y',
            },
            order: [['updated_at', 'DESC']]
        }).then(call_blending=>{
            if(call_blending){
                res.send({
                    success: true,
                    data:call_blending
                })
            }else{
                res.send({
                    success: false
                })
            }
        }).catch(err=>{
            return this.sendResponseError(res, ['Error.CannotGetCallBlending', err], 1, 403);
        })
    }

    eavesdrop (req, res, next){
        let agent_id = req.body.agent_id;
        let supSipUri = req.body.sip_uri
        let domain = req.body.domain
        if(!!!agent_id){
            res.send({
                success: false,
                message: 'agent id is null'
            })
            return
        }
        if(!!!supSipUri){
            res.send({
                success: false,
                message: 'supSipUri is null'
            })
            return
        }
        if(!!!domain){
            res.send({
                success: false,
                message: 'domain  is null'
            })
            return
        }
        this.db['users'].findOne({
            where:{
                user_id: agent_id,
                active : 'Y',
                status: 'Y'
            }
        }).then(agent=>{
            if (agent && agent.channel_uuid){
                let obj={
                    "channelUuid": agent.channel_uuid,
                    "supervisorSipUri": supSipUri+"@"+domain,
                    "callerIdNumber": "33980762256"
                }
                this.eavesdropCall(obj, (ok) => {
                    try {
                        if (ok) {
                            res.send({
                                success: true
                            })

                        } else {
                            res.send({
                                success: false,
                                message: 'error eavesdrop'
                            })
                        }
                    } catch (e) {
                        res.send({
                            success: false,
                            message: 'error eavesdrop'
                        })
                    }
                });
            }
        })
    }

    eavesdropCall(data, callback) {
        const options = {
            uri: 'https://sip-crm.oxilog-telecom.net:1443/api/v1/commands/eavesdrop',
            method: 'POST',
            json: true,
            body: data,
            auth: {
                'bearer': 'BomjNx8kFfZTdCFx4kH3hGECO78yS0C0KS7pgO0BUe8COxcved'
            }
        };
        request(options, function (error, response, body) {
            console.log('body', body)
            if (body && body.status === 'success') {
                callback(true);
            } else {
                callback(false);
            }
        });
    }


}

module.exports = callfiles;
