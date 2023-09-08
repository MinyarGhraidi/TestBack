const {baseModelbo} = require('./basebo');
let db = require('../models');
const fs = require("fs");
const {reject} = require("bcrypt/promises");
const efilesBo = require('./efilesbo');
const callhistoryBo = require('./callhistorybo');
const moment = require("moment");
const Op = require("sequelize/lib/operators");
const _efilebo = new efilesBo;
const _callhistorybo = new callhistoryBo;
const env = process.env.NODE_ENV || 'development';
const call_center_token = require(__dirname + '/../config/config.json')[env]["call_center_token"];
const base_url_cc_kam = require(__dirname + '/../config/config.json')[env]["base_url_cc_kam"];
const call_center_authorization = {
    headers: {Authorization: call_center_token}
};
const {default: axios} = require("axios");

class callfiles extends baseModelbo {
    constructor() {
        super('callfiles', 'callfile_id');
        this.baseModal = "callfiles";
        this.primaryKey = 'callfile_id';
    }

    _updateCallFileQualification(callfile_id, body, req) {
        return new Promise((resolve, reject) => {
            this.db['callfiles'].findOne({
                where: {
                    callfile_id: callfile_id
                }
            }).then(call_previous => {
                if (call_previous) {
                    if (body.customfields && body.customfields.length !== 0) {
                        const keys = body.customfields.map(c => c.value);
                        keys.forEach(key => {
                            delete body[key]
                        })
                    }
                    this.db['callfiles'].update(body,
                        {
                            where: {
                                callfile_id: callfile_id
                            },
                            returning: true,
                            plain: true
                        }).then(result => {
                        if (result) {
                            let obj = call_previous.dataValues
                            Object.entries(obj).map(item => {

                                let index = Object.entries(body).findIndex(element => element[0] === item[0])
                                if (index === -1) {
                                    delete obj[item[0]]
                                }
                                if (item[0] === 'customfields') {
                                    if (item[1] && item.length !== 0) {
                                        item[1].map(field => {
                                            obj[field.value] = field.default
                                        })
                                    }

                                }
                            })
                            let objAfter = body
                            delete objAfter.customfields
                            Object.entries(objAfter).map(element => {
                                if (Array.isArray(element[1])) {
                                    element[1] = element[1].toString()
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
                        } else {
                            resolve({
                                success: false,
                                message  :"cannot-update-callfile"
                            })
                        }

                    }).catch(err => {
                        reject(err)
                    })
                } else {
                    resolve({
                        success: false,
                        message  :"cannot-find-callfile"
                    })
                }

            }).catch(err => {
                reject(err)
            })
        })
    }

    SaveReminder = (is_reminder, data) => {
        return new Promise((resolve, reject) => {
            if (is_reminder) {
                let modalObj = this.db['reminders'].build(data)
                modalObj
                    .save()
                    .then(() => {
                        return resolve(true)
                    })
                    .catch(err => {
                        reject(err)
                    })
            } else {
                return resolve(true)
            }
        })
    }

    updateCallFileQualification(req, res, next) {
        let {call_file_data, call_history_data, is_reminder} = req.body
        let callfile_id = call_file_data.callfile_id
        this._updateCallFileQualification(callfile_id, call_file_data, req).then(result => {
            if (result.success) {
                this.SaveReminder(is_reminder, call_history_data).then(() => {
                    call_history_data.revision_id = result.revision_id
                    _callhistorybo._updateCall(call_history_data).then(resultHistory => {
                        res.send(resultHistory)
                    }).catch(err => {
                        this.sendResponseError(res, ['cannotUpdateCallFileHistory', err], 0, 403)
                    })
                }).catch(err => {
                    this.sendResponseError(res, ['cannotSaveReminder', err], 1, 403)
                })
            } else {
                res.send(result)
            }
        }).catch(err => {
            this.sendResponseError(res, ['cannotUpdateCallFile', err], 2, 403)
        })
    }

    leadsStats(req, res, next) {
        let _this = this;
        let data = req.body;
        const limit = parseInt(data.limit) > 0 ? data.limit : 1000;
        const offset = data.limit * (data.pages - 1) || 0
        if (!!!data.filter) {
            return res.send({
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
                                       where EXTRA_WHERE and active = 'Y' `

        let sqlLeads = `Select distinct callF.*, MAX(calls_h.finished_at) as finished_at, LCF.name as "list_leads_name"
                        from callfiles as callF
                                 left join calls_historys as calls_h on callF.callfile_id = calls_h.call_file_id
                                 join listcallfiles as LCF on LCF.listcallfile_id = callF.listcallfile_id
                        where calls_h.active = :active
                          and callF.active = :active
                          and callF.listcallfile_id in (:listCallFiles_ids)
                           EXTRA_WHERE 
                           group by callF.callfile_id, LCF.name order by finished_at desc LIMIT :limit OFFSET :offset
                         `
        let sqlLeadsCount = `Select count(distinct callF.*), MAX(calls_h.finished_at) as finished_at
                        from callfiles as callF
                                 left join calls_historys as calls_h on callF.callfile_id = calls_h.call_file_id
                        where calls_h.active = :active
                          and callF.active = :active
                          and callF.listcallfile_id in (:listCallFiles_ids)
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
        if (call_status && call_status.length !== 0) {
            extra_where += ' AND calls_h.call_status in (:call_status) '
        }
        if (phone_number && phone_number !== '') {
            extra_where += ' AND callF.phone_number = :phone_number '
        }
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
                    if (countAll.length === 0) {
                        return res.send({
                            success: true,
                            status: 200,
                            data: [],
                            message: 'no call file history'
                        })
                    }
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
                        return res.send({
                            success: true,
                            status: 200,
                            data: dataLeads,
                            attributes: attributes_res
                        })
                    }).catch(err => {
                        return _this.sendResponseError(res, ['Error stats1'], err)
                    })
                }).catch(err => {
                    return _this.sendResponseError(res, ['Error stats2'], err)
                })
            } else {
                return res.send({
                    success: true,
                    status: 200,
                    data: [],
                    message: 'no call file history'
                })
            }
        }).catch(err => {
            return _this.sendResponseError(res, ['Error stats3'], err)
        })

    }

    ReformatOneFileCSVExport(item, schema) {
        return new Promise((resolve, reject) => {
            let dataSchema = [];
            let idx = 0;
            schema.forEach(data => {
                dataSchema.push(item[data.currentColumn]);
                if (idx < schema.length - 1) {
                    idx++;
                } else {
                    if (dataSchema.length !== 0) {
                        dataSchema[0] = "\r\n" + dataSchema[0]
                    }
                    resolve(dataSchema)
                }
            })
        })
    }

    leadsStatsExport(req, res, next) {
        let _this = this;
        let data = req.body;
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
            agents_ids
        } = data.filter;

        let sqlListCallFiles = `select listcallfile_id from listcallfiles
                                       where EXTRA_WHERE and active = 'Y' `

        let SqlQuery = `Select distinct 
callF.phone_number as "Phone Number",
LCF.name as "List Leads Name",
CONCAT(callF.first_name, ' ', callF.last_name) as "Client Name",
callF.address1 as "Address", 
callF.state as "State",
callF.city as "City",
callF.province as "Province",
callF.postal_code as "Postal Code",
callF.email as "Client Email",
callF.country_code as "Country Code",
callF.note as "Note",
CS.label as "Call Status",
callF.gender as "Gender",
callF.age as "Age",
callF.company_name as "Company Name",
callF.siret as "Siret",
callF.siren as "Siren",
callF.date_of_birth as "Date Of Birth",
callF.category as "Category",
CONCAT(U.first_name, ' ', U.last_name) as "Agent Name" 
                        from callfiles as callF
                        left join calls_historys as calls_h on callF.callfile_id = calls_h.call_file_id
                        join listcallfiles AS LCF ON LCF.listcallfile_id = callF.listcallfile_id
                        LEFT OUTER JOIN users AS U ON calls_h.agent_id = U.user_id
                        LEFT OUTER JOIN callstatuses AS CS ON calls_h.call_status = CS.code 
                        where calls_h.active = :active
                          and callF.active = :active
                          and U.active = :active
                          and CS.active = :active
                            EXTRA_WHERE`

        let extra_where_sqlListCallFile = '';
        let extra_where_ListCallFile = '';
        if (listCallFiles_ids && listCallFiles_ids.length === 0) {
            extra_where_ListCallFile = " campaign_id in (:campaign_ids) ";
        } else {
            extra_where_ListCallFile = " listcallfile_id in (:listCallFiles_ids) ";
        }
        if (agents_ids && agents_ids.length !== 0) {
            extra_where_sqlListCallFile += ' AND calls_h.agent_id in (:agents_ids)';
        }
        if (startTime && startTime !== '') {
            extra_where_sqlListCallFile += ' AND calls_h.started_at >= :start_time';
        }
        if (endTime && endTime !== '') {
            extra_where_sqlListCallFile += ' AND calls_h.finished_at <=  :end_time';
        }
        if (call_status && call_status.length !== 0) {
            extra_where_sqlListCallFile += ' AND calls_h.call_status in (:call_status) '
        }
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
                extra_where_sqlListCallFile += ' AND callF.listcallfile_id in (:listCallFiles_ids)'
                SqlQuery = SqlQuery.replace('EXTRA_WHERE', extra_where_sqlListCallFile);
                db.sequelize['crm-app'].query(SqlQuery, {
                    type: db.sequelize['crm-app'].QueryTypes.SELECT,
                    replacements: {
                        start_time: moment(dateSelected_from).format('YYYY-MM-DD').concat(' ', startTime),
                        end_time: moment(dateSelected_to).format('YYYY-MM-DD').concat(' ', endTime),
                        listCallFiles_ids: lCF_ids,
                        active: 'Y',
                        call_status: call_status,
                        agents_ids: agents_ids
                    }
                }).then(dataLeads => {
                    if (dataLeads && dataLeads.length !== 0) {
                        let schema = [
                            {
                                column: 'Phone Number',
                                type: 'String',
                                currentColumn: 'Phone Number',
                            },
                            {
                                column: 'List Leads Name',
                                type: 'String',
                                currentColumn: 'List Leads Name',
                            },
                            {
                                column: 'Client Name',
                                type: 'String',
                                currentColumn: 'Client Name',
                            },
                            {
                                column: 'Address',
                                type: 'String',
                                currentColumn: 'Address',

                            },
                            {
                                column: 'State',
                                type: 'String',
                                currentColumn: 'State',
                            },
                            {
                                column: 'City',
                                type: 'String',
                                currentColumn: 'City',

                            },
                            {
                                column: 'Province',
                                type: 'String',
                                currentColumn: 'Province',
                            }, {
                                column: 'Postal Code',
                                type: 'String',
                                currentColumn: 'Postal Code',

                            }, {
                                column: 'Client Email',
                                type: 'String',
                                currentColumn: 'Client Email',

                            }, {
                                column: 'Country Code',
                                type: 'String',
                                currentColumn: 'Country Code',

                            },
                            {
                                column: 'Note',
                                type: 'String',
                                currentColumn: 'Note',

                            },

                            {
                                column: 'Call Status',
                                type: 'String',
                                currentColumn: 'Call Status',

                            },
                            {
                                column: 'Gender',
                                type: 'String',
                                currentColumn: 'Gender',

                            },
                            {
                                column: 'Age',
                                type: 'String',
                                currentColumn: 'Age',

                            },
                            {
                                column: 'Company Name',
                                type: 'String',
                                currentColumn: 'Company Name',

                            },
                            {
                                column: 'Siret',
                                type: 'String',
                                currentColumn: 'Siret',

                            },
                            {
                                column: 'Siren',
                                type: 'String',
                                currentColumn: 'Siren',
                            },
                            {
                                column: 'Date Of Birth',
                                type: 'String',
                                currentColumn: 'Date Of Birth',

                            },
                            {
                                column: 'Agent Name',
                                type: 'String',
                                currentColumn: 'Agent Name',

                            },
                            {
                                column: 'Category',
                                type: 'String',
                                currentColumn: 'Category',

                            }

                        ]
                        const Sc = ['Phone Number', 'List Leads Name', 'Client Name', 'Address', 'State', 'City', 'Province', 'Postal Code', 'Client Email', 'Country Code', 'Note', 'Call Status', 'Gender', 'Age', 'Company Name', 'Siret', 'Siren', 'Date Of Birth', 'Agent Name', 'Category']
                        let ResultArray = [Sc];
                        let indexMapping = 0;
                        dataLeads.forEach(data_item => {
                            this.ReformatOneFileCSVExport(data_item, schema).then(dataFormat => {
                                if (indexMapping < dataLeads.length - 1) {
                                    indexMapping++;
                                    ResultArray.push(dataFormat)
                                } else {
                                    ResultArray.push(dataFormat);
                                    return res.send({
                                        data: ResultArray,
                                        success: true
                                    })
                                }
                            }).catch(err => {
                                this.sendResponseError(res, ["Error.CannotGetCDRS"], 1, 403)
                            })
                        })
                    } else {
                        return res.send({
                            data: [],
                            success: false
                        })
                    }
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
            return _this.sendResponseError(res, ['Error stats'], err)
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

    mergeCustomFields(_customFields) {
        return new Promise((resolve, reject) => {
            let customFields = _customFields.filter(elements => {
                return elements !== null;
            });
            if (customFields && customFields.length === 0) {
                return resolve([])
            }
            const distinctValues = [...new Set(customFields.flat().map(obj => obj.label))];
            return resolve(distinctValues)
        })
    }

    _getCustomFields(listCallfiles){
        return new Promise((resolve, reject) => {
            let AllCustomFields = []
            let idx = 0
            listCallfiles.forEach(list_call_file => {
                if (list_call_file.templates_id) {
                    this.db['templates_list_call_files'].findOne({
                        where: {
                            templates_list_call_files_id: list_call_file.templates_id,
                            active: 'Y'
                        }
                    }).then(template => {
                        let CF = template.custom_field;
                        if (idx < listCallfiles.length - 1) {
                            idx++;
                            if (CF && CF.length !== 0) {
                                AllCustomFields.push(CF)
                            }
                        } else {
                            AllCustomFields.push(CF)
                            return resolve(AllCustomFields)
                        }
                    }).catch(err => {
                        reject(err)
                    })
                } else {
                    let CF_list = list_call_file.custom_fields;
                    if (idx < listCallfiles.length - 1) {
                        idx++;
                        if (CF_list && CF_list.length !== 0) {
                            AllCustomFields.push(CF_list)
                        }
                    } else {
                        AllCustomFields.push(CF_list)
                        return resolve(AllCustomFields)
                    }
                }
            })

        })
    }

    getCustomFields(req, res, next) {
        let campaign_id = req.body.campaign_id;
        if (!!!campaign_id) {
            this.sendResponseError(res, ['Error.campaignIdRequired'])
            return
        }
        const Fields = ['first_name', 'last_name', 'phone_number', 'address1', 'city', 'postal_code', 'email', 'country_code'];
        this.db['listcallfiles'].findAll({where: {campaign_id: campaign_id, active: 'Y'}}).then(async listcallfiles => {
            if (listcallfiles && listcallfiles.length !== 0) {
                this._getCustomFields(listcallfiles).then(CS => {
                    this.mergeCustomFields(CS).then(res_CS => {
                        return res.send({
                            success: true,
                            status: 200,
                            data: Fields.concat(res_CS)
                        })
                    })
                })
            } else {
                return res.send({
                    success: true,
                    status: 200,
                    data: Fields
                })
            }
        }).catch(err => {
            this.sendResponseError(res, ['Error Cannot get CustomFields'], err)
        })
    }

    fieldCallFile(mapping, call_file) {
        return new Promise((resolve, reject) => {
            let dataField = [];
            let index = 0;
            Object.entries(call_file).map(item => {
                let indexField = Object.keys(mapping).findIndex(element => element === item[0])
                if (indexField !== -1) {
                    dataField.push([item[0], item[1]])
                }
                if (index < Object.entries(call_file).length - 1) {
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
                } else if (item[0] === 'comments') {
                    schema.properties[item[0]] = {
                        type: "string",
                        default: item[1],
                        format: "textarea"
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
                    if (dataSchema[index1][0] === 'comments' || dataSchema[index2][0] === 'comments') {
                        obj['comments'] = {sm: 12}
                    } else {
                        obj[dataSchema[index1][0]] = {sm: 6}
                        obj[dataSchema[index2][0]] = {sm: 6}
                    }
                    uiSchema["ui:layout"].push(obj)
                } else if (dataSchema[index1]) {
                    if (dataSchema[index1][0] === 'comments' || dataSchema[index1][0] === 'comments') {
                        obj['comments'] = {sm: 12}
                    } else {
                        obj[dataSchema[index1][0]] = {sm: 6}
                    }
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
            if (!!!!call_file.templates_id) {
                this.db['templates_list_call_files'].findOne({
                    where: {
                        active: 'Y',
                        status: 'Y',
                        templates_list_call_files_id: call_file.templates_id
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
                mapping = call_file.mapping || {}
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
                                    call_file.customfields = []
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

    _findCallFile(data,table = "hoopers"){
        return new Promise((resolve,reject) => {
            if (!!!data.phone_number && !!!data.callfile_id) {
                return reject('Empty')
            }
            if (!!!data.account_id) {
                return reject('Error empty account_id')
            }
            let sqlQuerySelectLeads = `SELECT CF.*, LCF.*, C.script, C.account_id FROM ${table} AS CF 
                                       LEFT OUTER JOIN listcallfiles AS LCF ON CF.listcallfile_id = LCF.listcallfile_id
                                       LEFT OUTER JOIN campaigns AS C ON C.campaign_id = LCF.campaign_id
                                       WHERE  C.active = :active AND LCF.active = :active AND length(phone_number) >=9 AND CF.active = :active WHERE_CONDITION LIMIT :limit;`


            let whereQuery = ''
            if (data && data.phone_number) {
                whereQuery += ` AND (CF.phone_number = :phone_number OR CF.phone_number like CONCAT('%',:phone_number)) `
            }
            if (data && data.callfile_id) {
                whereQuery += ` AND CF.callfile_id = :callfile_id `
            }
            if (data && data.account_id) {
                whereQuery += ` AND C.account_id = :account_id `
            }
            sqlQuerySelectLeads = sqlQuerySelectLeads.replace('WHERE_CONDITION', whereQuery);
            db.sequelize['crm-app'].query(sqlQuerySelectLeads, {
                type: db.sequelize['crm-app'].QueryTypes.SELECT,
                replacements: {
                    active: 'Y',
                    phone_number: data.phone_number || null,
                    callfile_id: data.callfile_id || null,
                    account_id: data.account_id,
                    limit: 1
                }
            }).then((call_file) => {
                let cfLength = call_file.length || 0
                if (cfLength === 0) {
                    return resolve({
                        success: false,
                        message : 'unknown-number'
                    })
                } else {
                    let schema = {
                        type: 'object',
                        properties: {}
                    }
                    let mapping = {}
                    this.createSchemaUischema(call_file[0], mapping, schema).then(result => {
                        if (result.success) {
                            return resolve({
                                success: true,
                                data: call_file[0],
                                schema: result.schema,
                                uiSchema: result.uiSchema,
                            })
                        } else {
                            return resolve({
                                success: false,
                                message: result.message
                            })
                        }
                    }).catch(err => {
                        return reject('Error, ',err)
                    })
                }

            })
        })
    }
    findCallFile(req, res, next) {
        let _this = this
        const data = req.body;
        this._findCallFile(data).then(resp_data => {
            if(resp_data.success){
                return res.send(resp_data)
            }else{
                this._findCallFile(data,'callfiles').then(resp_data2 => {
                    return res.send(resp_data2)
                })
            }
        }).catch(err => {
            _this.sendResponseError(res,['Error',err],1,403)
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
                    this.updateCallFileTreatAndHooper(result.data).then(() => {
                        res.send({
                            success: true,
                            status: 200
                        })
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
                    this.updateCallFileTreatAndHooper(result.data).then(() => {
                        res.send({
                            success: true,
                            status: 200
                        })
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

    updateCallFileTreatAndHooper(callFile_ids) {
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
                }
            }).then(() => {
                resolve(true)
            }).catch(err => reject(err))
        })
    }

    getCallFileIdsByCampaignID(campaign_id) {
        return new Promise((resolve, reject) => {
            this.db['campaigns'].findOne({
                where: {
                    campaign_id: campaign_id,
                    active: 'Y',
                    status: 'Y'
                }
            }).then(campaign => {
                if (campaign && Object.keys(campaign) && Object.keys(campaign).length !== 0) {
                    let Camp_CS_ids = campaign.call_status_ids || [];
                    this.db['callstatuses'].findAll({
                        where: {
                            active: 'Y',
                            status: 'Y',
                            callstatus_id: Camp_CS_ids
                        }
                    }).then((res_CS) => {
                        if (res_CS && res_CS.length !== 0) {
                            let CS_codes = [];
                            res_CS.map(item => {
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
                                            [Op.or]: [
                                                {call_status: CS_codes},
                                                {
                                                    call_status: null,
                                                    to_treat: 'Y',
                                                    save_in_hooper: 'Y'
                                                }
                                            ]
                                        }
                                    }).then(callfiles => {
                                        if (callfiles && callfiles.length !== 0) {
                                            let CF_ids = [];
                                            callfiles.forEach(CF => CF_ids.push(CF.callfile_id));
                                            if (CF_ids.length === callfiles.length) {
                                                resolve({
                                                    success: true,
                                                    data: CF_ids,
                                                    call_status: CS_codes
                                                })
                                            }
                                        } else {
                                            resolve({
                                                success: false,
                                                message: 'list-leads-without-leads'

                                            })
                                        }
                                    }).catch(err => reject(err))
                                } else {
                                    resolve({
                                        success: false,
                                        message: 'campaign-without-list-leads'
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
                if (listcallfile && Object.keys(listcallfile) && Object.keys(listcallfile).length !== 0) {
                    this.db['campaigns'].findOne({
                        where: {
                            campaign_id: listcallfile.campaign_id,
                            active: 'Y'
                        }
                    }).then((camp) => {
                        if (camp) {
                            if (camp.status === 'N') {
                                return resolve({
                                    success: false,
                                    message: 'You have to enable Campaign first !'
                                })
                            }
                            let Camp_CS_ids = camp.call_status_ids || [];
                            this.db['callstatuses'].findAll({
                                where: {
                                    active: 'Y',
                                    status: 'Y',
                                    callstatus_id: Camp_CS_ids
                                }
                            }).then((res_CS) => {
                                if (res_CS && res_CS.length !== 0) {
                                    let CS_codes = [];
                                    res_CS.map(item => {
                                        CS_codes.push(item.code);
                                    })
                                    this.db['callfiles'].findAll({
                                        where: {
                                            listcallfile_id: list_call_file_id,
                                            active: 'Y',
                                            [Op.or]: [
                                                {call_status: CS_codes},
                                                {
                                                    call_status: null,
                                                    to_treat: 'Y',
                                                    save_in_hooper: 'Y'
                                                }
                                            ]
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
                                } else {
                                    resolve({
                                        success: false,
                                        message: 'Campaign without CS !'
                                    })
                                }

                            }).catch(err => reject(err))
                        } else {
                            resolve({
                                success: false,
                                message: 'Campaign Not found !'
                            })
                        }


                    }).catch(err => reject(err))
                } else {
                    reject(false)
                }
            }).catch(err => reject(err))
        })
    }

    getCallBlending(req, res, next) {
        let number = req.body.number;
        if (!!!number) {
            return this.sendResponseError(res, ['Error.numberIsNull',], 1, 403);
        }
        this.db['callfiles'].findOne({
            where: {
                phone_number: number,
                active: 'Y',
            },
            order: [['updated_at', 'DESC']]
        }).then(call_blending => {
            if (call_blending) {
                res.send({
                    success: true,
                    data: call_blending
                })
            } else {
                res.send({
                    success: false
                })
            }
        }).catch(err => {
            return this.sendResponseError(res, ['Error.CannotGetCallBlending', err], 1, 403);
        })
    }

    eavesdrop(req, res, next) {
        let agent_id = req.body.agent_id;
        let supSipUri = req.body.sip_uri
        let domain = req.body.domain
        let server_uuid = req.body.server_uuid
        if (!!!agent_id || !!!supSipUri || !!!domain || !!!server_uuid) {
            return this.sendResponseError(res, ['Error.dataAgentNUll'], 1, 403);
        }
        this.db['users'].findOne({
            where: {
                user_id: agent_id,
                active: 'Y',
                status: 'Y'
            }
        }).then(agent => {
            if (!!!agent || !!!agent.channel_uuid) {
                return this.sendResponseError(res, ['Error.dataAgentNUll'], 1, 403);
            } else {
                let obj = {
                    "channelUuid": agent.channel_uuid,
                    "supervisorSipUri": supSipUri + "@" + domain,
                    "callerIdNumber": "33980762256",
                    "serverUuid": server_uuid
                }
                axios.post(`${base_url_cc_kam}api/v1/commands/eavesdrop`, obj, call_center_authorization).then(result => {
                    if (result.data && result.data.status === 'success') {
                        res.send({
                            success: true
                        })
                    } else {
                        res.send({
                            success: false
                        })
                    }

                }).catch(err => {
                    return this.sendResponseError(res, ['Error.eavesdrop', err], 1, 403);
                })

            }
        }).catch(err => {
            return this.sendResponseError(res, ['Error.FindUser', err], 1, 403);
        })
    }

    _getCFListsByIDList = (list_leads_id) => {
        return new Promise((resolve, reject) => {
            let sqlQuerySelect = `select * from vicidial_list where list_id = :callfile_id;`
            db.sequelize['crm-sql'].query(sqlQuerySelect, {
                type: db.sequelize['crm-sql'].QueryTypes.SELECT,
                replacements: {
                    callfile_id: list_leads_id
                }
            }).then(data => {
                resolve({
                    total: data.length,
                    data
                })
            }).catch(err => {
                reject(err)
            })
        })
    }
    getCFListsByIDList = (req, res, next) => {
        let list_id = req.body.list_id;
        this._getCFListsByIDList(list_id).then(result => {
            res.send(result)
        }).catch(err => {
            res.status(403).send({
                success: false,
                err: err
            })
        })
    }

}

module.exports = callfiles;
