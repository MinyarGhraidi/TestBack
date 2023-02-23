const fs = require("fs");
const Op = require("sequelize/lib/operators");
const moment = require("moment/moment");
const xlsx = require("xlsx");
const db = require("../../models");
const {baseModelbo} = require("../../bo/basebo");
const path = require("path");
const appDir = path.dirname(require.main.filename);
const appSocket = new (require("../../providers/AppSocket"))();

class AddCallFile extends baseModelbo {


    updateNumberCallFiles(lengthCallFiles, ListCallFile_id) {
        return new Promise((resolve, reject) => {
            this.db['listcallfiles'].update({
                updated_at: moment(new Date()), processing: 1
            }, {where: {listcallfile_id: ListCallFile_id, active: 'Y'}}).then(() => {
                resolve(true)
            }).catch(err => reject(err))
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
                        let path_dir = path.join(appDir + '../../../resources/efiles' + efile.uri)
                        if (efile.file_extension === 'csv' || efile.file_extension === 'xlsx' || efile.file_extension === 'xls') {
                            if (fs.existsSync(path_dir)) {
                                const workbook = xlsx.readFile(path_dir);
                                const sheetNames = workbook.SheetNames;
                                result = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
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
                    reject(err);
                });
            }
        })
    }
    getCustomFieldsAndDataMapping(listCallFileItem) {
        return new Promise((resolve, reject) => {
            let dataMapping = {}
            let custom_field = []
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
                }).catch(err => {
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
    }
    CallFileMapping(listCallFileID, E_File, DataMap) {
        return new Promise((resolve, reject) => {
            this.SqueletteCallFile(DataMap, E_File).then(SequeletteCF => {
                this.saveCustomField(listCallFileID, E_File, SequeletteCF).then(() => {
                    resolve(true)
                }).catch(err => {
                    reject(err);
                });
            }).catch(err => {
                reject(err);
            });
        })

    }
    SqueletteCallFile(dataMap, item_callFile) {
        return new Promise((resolve, reject) => {
            let basic_fields = [
                'phone_number',
                'last_name',
                'middle_initial',
                'title',
                'address1',
                'address2',
                'address3',
                'state',
                'city',
                'province',
                'postal_code',
                'email',
                'country_code',
                'first_name',
                'gender',
                'age',
                'company_name',
                'category',
                'siret',
                'siren'
            ]
            let indexMapping = 0;
            let dataMapping = dataMap.dataMapping;
            let CF = dataMap.custom_field;
            let callFile = {customfields: CF}
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
                        callFile.customfields[key] = item_callFile[fieldName]
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
    CallFiles_Mapping(ListCallFile, CallFiles, Phone_attribute) {
        return new Promise((resolve, reject) => {
            let idx = 0;
            if (CallFiles && CallFiles.length !== 0) {
                this.getCustomFieldsAndDataMapping(ListCallFile).then(DataMap => {
                    const CF = DataMap.custom_field
                    let PromiseInject = new Promise((resolve, reject) => {
                        let idx = 0
                        CallFiles.map((callFile, index) => {
                            callFile.customfields = CF
                            if (index < CallFiles.length - 1) {
                                idx++
                            } else {
                                resolve(CallFiles)
                            }
                        })
                    })
                    Promise.all([PromiseInject]).then(callfilesInjected => {
                        let CFInj = callfilesInjected[0];
                        let DataCallFile = {
                            length : 0,
                            index : 0,
                            deplicated : 0,
                            status : false
                        }
                        CFInj.forEach(E_File => {
                            let PhoneNumber = E_File[Phone_attribute];
                            if (PhoneNumber) {
                                DataCallFile.length += 1;
                                this.checkDuplicationListCallFile(PhoneNumber, ListCallFile).then(check_duplication => {
                                    if (check_duplication) {
                                        DataCallFile.status = idx === CFInj.length - 1;
                                        DataCallFile.index += 1;
                                        this.CallFileMapping(ListCallFile.listcallfile_id, E_File, DataMap).then(() => {
                                            if (idx < CFInj.length - 1) {
                                                idx++
                                            } else {
                                                this.updateListCallFile(ListCallFile.listcallfile_id,DataCallFile.length,DataCallFile.index, DataCallFile.deplicated).then(()=>{
                                                    resolve(true)
                                                }).catch(err=> reject(err))
                                            }
                                        }).catch(err => {
                                            reject(err)
                                        })
                                    }else{
                                        DataCallFile.deplicated += 1;
                                        if (idx < CFInj.length - 1) {
                                            idx++
                                        } else {
                                            this.updateListCallFile(ListCallFile.listcallfile_id,DataCallFile.length,DataCallFile.index, DataCallFile.deplicated).then(()=>{
                                                resolve(true)
                                            }).catch(err=> reject(err))
                                        }
                                    }
                                }).catch(err => reject(err))
                            }else{
                                if (idx < CFInj.length - 1) {
                                    idx++
                                } else {
                                    this.updateListCallFile(ListCallFile.listcallfile_id,DataCallFile.length,DataCallFile.index, DataCallFile.deplicated).then(()=>{
                                        resolve(true)
                                    }).catch(err=> reject(err))
                                }
                            }

                        })
                    })

                }).catch(err => reject(err))

            } else {
                resolve(true)
            }
        })
    }
    saveCustomField(listCallFileID, callFile, callFileSaved) {
        return new Promise((resolve, reject) => {
            if (callFile && callFile.length !== 0) {
                let FullCallFile = JSON.parse(JSON.stringify(callFileSaved));
                FullCallFile.customfields.forEach(item => {
                    if (item.type === 'text') {
                        if (callFile[item.value] !== undefined) {
                            item.default = callFile[item.value]
                        } else {
                            item.default = null
                        }
                    } else {
                        let exist = false;
                        if (callFile[item.value] !== undefined) {
                            item.options.map(element => {
                                if (element.id === callFile[item.value]) {
                                    exist = true
                                }
                            })
                            if (exist === false) {
                                item.default = callFile[item.value];
                                item.options.push({
                                    id: callFile[item.value],
                                    text: callFile[item.value]
                                })
                            }
                        } else {
                            item.default = callFile[item.value];
                            item.options.push({
                                id: callFile[item.value],
                                text: callFile[item.value]
                            })
                        }
                    }
                })
                let Date_TZ = moment(new Date());
                FullCallFile.updated_at = Date_TZ;
                FullCallFile.created_at = Date_TZ;
                FullCallFile.listcallfile_id = listCallFileID;
                FullCallFile.to_treat = "N";
                FullCallFile.save_in_hooper = "N";
                FullCallFile.status = "Y";
                this.db['callfiles'].build(FullCallFile).save().then(() => {
                        resolve(true)
                }).catch(err => {
                    reject(err);
                });
            } else {
                resolve(true)
            }
        })
    }
    updateListCallFile(_id,nbr_callfiles, nbr_uploaded_callfiles, nbr_duplicated_callfiles){
        return new Promise((resolve,reject)=>{
            let item_toUpdate = {
                processing_status: {
                    "nbr_callfiles": nbr_callfiles,
                    "nbr_uploaded_callfiles": nbr_uploaded_callfiles,
                    "nbr_duplicated_callfiles": nbr_duplicated_callfiles
                }
            };
            this.db['listcallfiles'].update(item_toUpdate, {
                where: {
                    listcallfile_id: _id
                }
            }).then(() => {
                resolve(true)
            }).catch(err => {
                reject(err);
            });
        })
    }
    checkDuplicationListCallFile(phone_number, ListCallFile) {
        return new Promise((resolve, reject) => {
            let check_duplication = ListCallFile.check_duplication;
            let campaign_id = ListCallFile.campaign_id;
            let list_call_file_id = ListCallFile.listcallfile_id;
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
    getPhoneNumberAttribute(ListCallFile_item) {
        return new Promise((resolve, reject) => {
            if (!!!ListCallFile_item.templates_id) {
                resolve(ListCallFile_item.mapping.phone_number)
            } else {
                this.db['templates_list_call_files'].findOne({
                    where: {
                        templates_list_call_files_id: ListCallFile_item.templates_id,
                        active: 'Y'
                    }
                }).then(temp => {
                    resolve(temp.template.phone_number)
                }).catch(err => reject(err))
            }
        })
    }
    cronListCallFiles() {
        return new Promise((resolve, reject) => {
            this.db['listcallfiles'].findAll({
                where: {
                    file_id: {[Op.not]: null},
                    active: 'Y',
                    processing: 0
                }
            }).then(dataListCallFiles => {
                if (dataListCallFiles.length === 0) {
                    resolve({
                        message: "everything is okey !"
                    })
                }
                let Camp_ids = [];
                let idxLCF = 0;
                dataListCallFiles.forEach(ListCallFile_item => {
                    this.getPhoneNumberAttribute(ListCallFile_item).then(Phone_Attribute => {
                        this.getCallFiles(ListCallFile_item.file_id).then(data => {
                            if (data && data.length !== 0) {
                                if (!Camp_ids.includes(ListCallFile_item.campaign_id)) {
                                    Camp_ids.push(ListCallFile_item.campaign_id);
                                }
                            }
                            this.updateNumberCallFiles(data.length, ListCallFile_item.listcallfile_id).then(() => {
                                this.CallFiles_Mapping(ListCallFile_item, data, Phone_Attribute).then(() => {
                                    if (idxLCF < dataListCallFiles.length - 1) {
                                        idxLCF++;
                                    } else {
                                        appSocket.emit('refresh_list_callFiles', {campaign_ids: Camp_ids});
                                        resolve({
                                            message: "Done !"
                                        })
                                    }
                                }).catch(err => {
                                    reject(err)
                                })
                            }).catch(err => reject(err))
                        }).catch(err => reject(err))
                    }).catch(err => reject(err))
                })
            }).catch(err => reject(err))
        })
    }
}

module.exports = AddCallFile