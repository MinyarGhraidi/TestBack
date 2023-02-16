const fs = require("fs");
const Op = require("sequelize/lib/operators");
const moment = require("moment/moment");
const xlsx = require("xlsx");
const db = require("../../models");
const {baseModelbo} = require("../../bo/basebo");
const path = require("path");
const appDir = path.dirname(require.main.filename);
const appSocket = new (require("../../providers/AppSocket"))();

class AddCallFile extends baseModelbo{
    countRows(file) {
        const workbook = xlsx.readFile(file);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const range = xlsx.utils.decode_range(worksheet['!ref']);
        return range.e.r + 1;
    };
    updateNumberCallFiles(lengthCallFiles,ListCallFile_id) {
        return new Promise((resolve, reject) => {
                            let processing_status = {
                                "nbr_callfiles": lengthCallFiles,
                                "nbr_uploaded_callfiles": 0,
                                "nbr_duplicated_callfiles": 0
                            }
                            this.db['listcallfiles'].update({
                                updated_at: moment(new Date()), processing_status: processing_status, processing : 1
                            }, {where: {listcallfile_id: ListCallFile_id, active: 'Y'}}).then(()=>{
                                resolve(true)
                            }).catch(err=> reject(err))
        })
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
                        let path_dir = path.join(appDir+'../../../resources/efiles' + efile.uri)
                        if (efile.file_extension === 'csv' || efile.file_extension === 'xlsx' || efile.file_extension === 'xls') {
                            if (fs.existsSync(path_dir)) {
                                const workbook = xlsx.readFile(path_dir);
                                const sheetNames = workbook.SheetNames;
                                result = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
                                resolve(result);
                            } else {
                                resolve(result);
                            }
                        }else{
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
    CallFileMapping(nbr_callFiles, listcallfile_item_to_update, listCallFileItem, item_callFile, campaign_id, check_duplication, attribute_phone_number, custom_fields_list_call_file, index) {
        return new Promise((resolve, reject) => {
            let list_call_file_id = listCallFileItem.listcallfile_id;
            let callFile = {};
            callFile.listcallfile_id = listCallFileItem.listcallfile_id;
            callFile.status = 0;
            callFile.customfields = {};
            let basic_fields = [
                'province',
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
                    }).catch(err =>{
                        reject(err)
                    })
                } else {
                    dataMapping = listCallFileItem.mapping;
                    custom_field = listCallFileItem.custom_fields;
                    resolve({
                        dataMapping: dataMapping,
                        custom_field: custom_field
                    })
                }
            })

            Promise.all([PromiseMapping]).then(dataMapping => {
                this.CreateCallFileItem(dataMapping[0].dataMapping, listCallFileItem, basic_fields, callFile, item_callFile, indexMapping).then(callFile => {
                    this.saveCustomField(dataMapping[0].custom_field, listCallFileItem, callFile, item_callFile).then(customField => {
                        callFile.customfields = customField.customfields;
                        callFile.created_at = new Date();
                        callFile.updated_at = new Date();
                        this.checkDuplicationListCallFile(item_callFile, check_duplication, listCallFileItem.campaign_id, attribute_phone_number, list_call_file_id).then(check_duplication => {
                            if (check_duplication) {
                                this.db['callfiles'].build(callFile).save().then(result => {
                                    let item_toUpdate = listcallfile_item_to_update;
                                    item_toUpdate.processing_status = {
                                        nbr_callfiles: nbr_callFiles,
                                        nbr_uploaded_callfiles: index,
                                        nbr_duplicated_callfiles: 0
                                    };
                                    if(index === nbr_callFiles){
                                        this.db['listcallfiles'].update(item_toUpdate, {
                                            where: {
                                                listcallfile_id: listCallFileItem.listcallfile_id
                                            }
                                        }).then(() => {
                                            resolve(true)
                                        }).catch(err => {
                                            reject(err);
                                        });
                                    }else{
                                        resolve(true)
                                    }
                                }).catch(err => {
                                    reject(err);
                                });
                            } else {
                                resolve(false);
                            }
                        }).catch(err => {
                            reject(err);
                        })
                    }).catch(err => {
                        reject(err);
                    });
                }).catch(err => {
                    reject(err);
                });
            })
        })
    }
    CreateCallFileItem = (dataMapping, listCallFileItem, basic_fields, callFile, item_callFile, indexMapping, customFields) => {
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
    CallFiles_Mapping(ListCallFile, CallFiles,Phone_attribute) {
        return new Promise((resolve, reject) => {
            let idx = 0;
            if(CallFiles && CallFiles.length !== 0){
                CallFiles.forEach((callFile,index) => {
                    let listcallfile_item_to_update = {
                        processing: 1,
                        listcallfile_id: ListCallFile.listcallfile_id,
                        processing_status: {
                            "nbr_callfiles": CallFiles.length,
                            "nbr_uploaded_callfiles": 0,
                            "nbr_duplicated_callfiles": 0
                        }
                    }
                    this.CallFileMapping(CallFiles.length, listcallfile_item_to_update, ListCallFile, callFile, ListCallFile.campaign_id, ListCallFile.check_duplication, Phone_attribute, ListCallFile.custom_fields, index+1).then(resultMapping => {
                        if (idx < CallFiles.length - 1) {
                            idx++
                        } else {
                            resolve(true)
                        }
                    }).catch(err=> {
                        reject(err)
                    })
                })
            }else{
                resolve(true)
            }
        })
    }
    saveCustomField(customField, listCallFileItem, callFile, item_callFile) {
        return new Promise((resolve, reject) => {
            if (customField && customField.length !== 0) {
                customField.map(item => {
                    if (item.type === 'text') {
                        if (item_callFile[item.value] !== undefined) {
                            item['default'] = item_callFile[item.value]
                        } else {
                            item['default'] = null
                        }
                    } else {
                        let exist = false;
                        if (item_callFile[item.value] !== undefined) {
                            item.options.map(element => {
                                if (element.id === item_callFile[item.value]) {
                                    exist = true
                                }
                            })
                            if (exist === false) {
                                item['default'] = item_callFile[item.value];
                                item.options.push({
                                    id: item_callFile[item.value],
                                    text: item_callFile[item.value]
                                })
                            }
                        } else {
                            item['default'] = item_callFile[item.value];
                            item.options.push({
                                id: item_callFile[item.value],
                                text: item_callFile[item.value]
                            })
                        }
                    }
                })

                resolve({
                    customfields: customField
                })
            } else {
                resolve({
                    customfields: []
                })
            }
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
                            phone_number: phone_number.toString(),
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

    getPhoneNumberAttribute(ListCallFile_item){
        return new Promise((resolve,reject)=>{
            if(!!!ListCallFile_item.templates_id){
                resolve(ListCallFile_item.mapping.phone_number)
            }else{
                this.db['templates_list_call_files'].findOne({where : {templates_list_call_files_id : ListCallFile_item.templates_id, active : 'Y'}}).then(temp =>{
                    resolve(temp.template.phone_number)
                }).catch(err=>reject(err))
            }
        })
    }

    cronListCallFiles() {
        return new Promise((resolve,reject)=>{
            this.db['listcallfiles'].findAll({
                where: {
                    file_id: {[Op.not]: null},
                    active: 'Y',
                    processing: 0
                }
            }).then(dataListCallFiles => {
                if (dataListCallFiles.length === 0) {
                    resolve({
                        message : "everything is okey !"
                    })
                }
                let Camp_ids = [];
                let idxLCF = 0;
                    dataListCallFiles.forEach(ListCallFile_item => {
                        this.getPhoneNumberAttribute(ListCallFile_item).then(Phone_Attribute=>{
                            this.getCallFiles(ListCallFile_item.file_id).then(data => {
                                if(data && data.length !== 0){
                                    if (!Camp_ids.includes(ListCallFile_item.campaign_id)) {
                                        Camp_ids.push(ListCallFile_item.campaign_id);
                                    }
                                }
                                this.updateNumberCallFiles(data.length,ListCallFile_item.listCallFile_id).then(()=>{
                                    this.CallFiles_Mapping(ListCallFile_item,data,Phone_Attribute).then(()=>{
                                        if(idxLCF < dataListCallFiles.length -1){
                                            idxLCF++;
                                        }else{
                                            appSocket.emit('refresh_list_callFiles', {campaign_ids : Camp_ids});
                                            resolve({
                                                message : "Done !"
                                            })
                                        }
                                    }).catch(err => reject(err))
                                }).catch(err=> reject(err))
                            }).catch(err => reject(err))
                        }).catch(err=> reject(err))
                    })
            }).catch(err =>reject(err))
        })
    }
}

module.exports = AddCallFile