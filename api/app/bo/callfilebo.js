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
const rabbitmq_url = appHelper.rabbitmq_url;
const app_config = require("../helpers/app").appConfig;
class callfiles extends baseModelbo {
    constructor(){
        super('callfiles', 'callfile_id');
        this.baseModal = "callfiles";
        this.primaryKey = 'callfile_id';
    }

    CallFilesMapping = (req, res, next) =>{
        let nbr_callFiles=  req.body.callFiles_options.nbr_callFiles;
        let listcallfile_item_to_update =req.body.callFiles_options.listcallfile_item_to_update;
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
        let key =0
        this.CreateCallFileItem(listCallFileItem, basic_fields, callFile, item_callFile, indexMapping).then(callFile => {
            key++;
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

    }

    CreateCallFileItem = (listCallFileItem, basic_fields, callFile, item_callFile, indexMapping) => {
        return new Promise((resolve, reject) => {
            Object.entries(listCallFileItem.mapping).forEach(([key, value]) => {
                if (basic_fields.includes(key)) {
                    if (listCallFileItem.mapping[key]) {
                        let fieldName =  (listCallFileItem.mapping[key]) ;
                        if (item_callFile[fieldName] !== undefined){
                            callFile[key] = item_callFile[fieldName] ;
                        }

                        if (indexMapping < listCallFileItem.mapping.length - 1) {
                            indexMapping++;
                        } else {
                            resolve(callFile);
                        }
                    } else {
                        if (indexMapping < listCallFileItem.mapping.length - 1) {
                            indexMapping++;
                        } else {
                            resolve(callFile);
                        }
                    }
                } else {

                    if (listCallFileItem.mapping[key]) {
                        let fieldName =  (listCallFileItem.mapping[key]) ;
                        console.log('item_callFile[fieldName]', item_callFile[fieldName])
                        callFile.customfields[key] = item_callFile[fieldName];
                    }
                    if (indexMapping < listCallFileItem.mapping.length - 1) {
                        indexMapping++;
                    } else {
                        resolve(callFile);
                    }
                }
                if (indexMapping < listCallFileItem.mapping.length - 1) {
                    indexMapping++;
                } else {
                    resolve(callFile);
                }
            });
        });
    }

    saveListCallFile = (req, res, next) =>{
        let CallFile = req.body;

        this.db['listcallfiles'].build(CallFile).save().then(save_list=>{
            this.LoadCallFile(save_list.listcallfile_id).then(result =>{
                if (result.success){
                    res.send({
                        success : true
                    })
                }else{
                    res.send({
                        success : false
                    })
                }

            }).catch(err =>{

            })
        }).catch(err =>{

        })
    }

    LoadCallFile = ( listcallfile_id) => {
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
                //console.log('res_listCallFile', res_listCallFile)
                if (res_listCallFile && res_listCallFile.length !== 0) {
                    _this.CallFilesInfo(res_listCallFile, params).then(callFilesMapping => {
                        if(callFilesMapping.success){
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
            console.log('data_listCallFileItem',data_listCallFileItem)
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
                                    where:{
                                        campaign_id: result[1].campaign_id
                                    }
                                }).then(campaign=>{
                                    this.sendDataToQueue(callFiles,campaign,data_listCallFileItem,listcallfile_item_to_update).then(send_callFile=>{
                                        resolve({send_callFile:send_callFile,
                                        success:true});
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
                                // csv({
                                //     noheader: true,
                                //     delimiter: [',', ';']
                                // })
                                //     .fromFile(path)
                                //     .then((jsonObj) => {
                                //         console.log('jsonObj',jsonObj)
                                //         result = jsonObj;
                                //         console.log('result', result)
                                //
                                //         resolve(result);
                                //     })
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

    sendDataToQueue(callFiles,campaign,data_listCallFileItem,listcallfile_item_to_update) {
        return new Promise((resolve, reject) => {
            console.log('rabbitmq_url',rabbitmq_url)
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
                    let data_call ={};
                    let index =0;

                    PromiseBB.each(callFiles, item => {
                        index++;
                        let progress =Math.round((100*index)/callFiles.length)
                        data_call.item_callFile =item;
                        data_call.callFiles_options={
                            data_listCallFileItem:data_listCallFileItem,
                            nbr_callFiles : callFiles ? callFiles.length : 0,
                            listcallfile_item_to_update:listcallfile_item_to_update,
                        };
                        data_call.index =index;
                        data_call.progress= progress;
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

    updateCallFileQualification (req, res, next){
        let callfile_id = req.body.callfile_id
        let note = req.body.note
        let callStatus = req.body.callStatus

        this.db['callfiles'].update({
            note:note,
            callStatus: callStatus
        },{
            where:{
                callfile_id:callfile_id
            }
        }).then(result=>{
            res.send({
                success: true
            })
        }).catch(err=>{
            return this.sendResponseError(res, ['Error', err], 1, 403);
        })
    }
}

module.exports = callfiles;
