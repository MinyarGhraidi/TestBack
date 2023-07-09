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


    updateNumberCallFiles(ListCallFile_id) {
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
                                resolve({ data  : result, message : 'None'});
                            } else {
                                resolve({ data  : [], message : `file '${efile.uri}' not found`});
                            }
                        } else {
                            resolve({ data  : [], message : `file '${efile.uri}' extension must be in (csv, xlsx, xls)`});
                        }
                    } else {
                        resolve({ data  : [], message : `file with file_id ${file_id} not found in database`});
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
                            length: 0,
                            index: 0,
                            deplicated: 0,
                            status: false
                        }
                        const regexNumbers = /^\d+$/;
                        const PhoneNumbers = []
                        const E_Files = []
                        let phoneCountAttribute = 0
                        CFInj.forEach(E_File => {
                            if (E_File[Phone_attribute] && regexNumbers.test(E_File[Phone_attribute].toString())) {
                                PhoneNumbers.push(E_File[Phone_attribute].toString())
                                E_Files.push(E_File)
                            } else {
                                phoneCountAttribute++
                            }
                        })
                        this.checkDuplicationListCallFile(PhoneNumbers, ListCallFile).then(async phoneNumbersToAdd => {
                            DataCallFile.deplicated = PhoneNumbers.length - phoneNumbersToAdd.length
                            if (phoneNumbersToAdd && phoneNumbersToAdd.length !== 0) {
                                DataCallFile.length = phoneNumbersToAdd.length
                                for (const phone_number of phoneNumbersToAdd) {
                                    DataCallFile.status = idx === E_Files.length - 1;
                                    DataCallFile.index += 1;
                                    let Efile = E_Files.filter(CF => CF[Phone_attribute].toString() === phone_number.toString())[0]
                                    await this.CallFileMapping(ListCallFile.listcallfile_id, Efile, DataMap).then(() => {
                                        if (idx < E_Files.length - 1) {
                                            idx++
                                        } else {
                                            this.updateListCallFile(ListCallFile.listcallfile_id, DataCallFile.index, DataCallFile.deplicated).then(() => {
                                                resolve({
                                                    phoneAttributeNotFound: phoneCountAttribute,
                                                    total: DataCallFile.index + DataCallFile.deplicated,
                                                    deplicated: DataCallFile.deplicated,
                                                    added: DataCallFile.index
                                                })
                                            }).catch(err => reject(err))
                                        }
                                    }).catch(err => {
                                        reject(err)
                                    })
                                }
                            } else {
                                this.updateListCallFile(ListCallFile.listcallfile_id, DataCallFile.index, DataCallFile.deplicated).then(() => {
                                    resolve({
                                        phoneAttributeNotFound: phoneCountAttribute,
                                        total: DataCallFile.index + DataCallFile.deplicated,
                                        deplicated: DataCallFile.deplicated,
                                        added: DataCallFile.index
                                    })
                                }).catch(err => reject(err))
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

    updateListCallFile(_id, nbr_uploaded_callfiles, nbr_duplicated_callfiles) {
        return new Promise((resolve, reject) => {
            let item_toUpdate = {
                processing_status: {
                    "nbr_callfiles": nbr_uploaded_callfiles + nbr_duplicated_callfiles,
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

    _Check_in_campaign_call_files = (campaign_id, phoneNumbers, list_call_file_id) => {
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
                    this.db['callfiles'].findAll({
                        where: {
                            listcallfile_id: {[Op.in]: data_id},
                            phone_number: {[Op.in]: phoneNumbers},
                            active: 'Y'
                        }
                    }).then(call_files => {
                        if (call_files && call_files.length !== 0) {
                            const PhoneNumbersExists = call_files.map(cf => cf.phone_number);
                            const PhoneNumbersToAdd = phoneNumbers.filter(element => !PhoneNumbersExists.includes(element));
                            resolve(PhoneNumbersToAdd)
                        } else {
                            resolve(phoneNumbers)
                        }
                    }).catch(err => {
                        reject(err)
                    })
                } else {
                    resolve(phoneNumbers)
                }
            }).catch(err => {
                reject(err)
            })
        })
    }
    _Check_in_list_call_file = (list_call_file_id, phoneNumbers) => {
        return new Promise((resolve, reject) => {
            this.db['callfiles'].findOne({
                where: {
                    listcallfile_id: list_call_file_id,
                    phone_number: {[Op.in]: phoneNumbers},
                    active: 'Y'
                }
            }).then(call_files => {
                if (call_files && call_files.length !== 0) {
                    const PhoneNumbersExists = call_files.map(cf => cf.phone_number);
                    const mergeAll = PhoneNumbersExists.concat(phoneNumbers);
                    const set = new Set(mergeAll);
                    const PhoneNumbersToAdd = [...set];
                    resolve(PhoneNumbersToAdd)
                } else {
                    resolve(phoneNumbers)
                }
            }).catch(err => {
                reject(err)
            })
        })
    }

    checkDuplicationListCallFile(phoneNumbers, ListCallFile) {
        return new Promise((resolve, reject) => {
            let check_duplication = ListCallFile.check_duplication;
            let campaign_id = ListCallFile.campaign_id;
            let list_call_file_id = ListCallFile.listcallfile_id;
            switch (check_duplication) {
                case  0: {
                    resolve(phoneNumbers)
                    break;
                }
                case 1: {
                    this._Check_in_campaign_call_files(campaign_id, phoneNumbers, list_call_file_id).then(result => {
                        resolve(result)
                    }).catch(err => {
                        reject(err)
                    })
                    break;
                }
                case 2: {
                    this._Check_in_list_call_file(list_call_file_id, phoneNumbers).then(result => {
                        resolve(result)
                    }).catch(err => {
                        reject(err)
                    })
                    break;
                }
            }
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

    _getCallFilesBySqlListID(sql_list_id, listCallfile_id) {
        return new Promise((resolve, reject) => {
            let sqlQuerySelect = `select phone_number,date_of_birth, first_name, last_name, middle_initial, title, address1, address2, address3, state, city, province, postal_code, email, country_code, gender from vicidial_list where list_id = :sql_list_id;`
            db.sequelize['crm-sql'].query(sqlQuerySelect, {
                type: db.sequelize['crm-sql'].QueryTypes.SELECT,
                replacements: {
                    sql_list_id: sql_list_id
                }
            }).then(async listLeads => {
                if (listLeads && listLeads.length !== 0) {
                    let idx_add = 0;
                    for (const listLead of listLeads) {
                        let Date_TZ = moment(new Date());
                        let data = {}
                        data.updated_at = Date_TZ;
                        data.created_at = Date_TZ;
                        data.listcallfile_id = listCallfile_id;
                        data.to_treat = "N";
                        data.save_in_hooper = "N";
                        data.status = "Y";
                        data = Object.assign(data, listLead);
                        this.db['callfiles'].build(data).save().then(() => {
                            if (idx_add < listLeads.length - 1) {
                                idx_add++;
                            } else {
                                this.db['listcallfiles'].update({
                                    updated_at: moment(new Date()), processing_status : {
                                        "nbr_callfiles": listLeads.length,
                                        "nbr_uploaded_callfiles": idx_add,
                                        "nbr_duplicated_callfiles": 0
                                    }}, {where: {listcallfile_id: listCallfile_id, active: 'Y'}}).then(() => {
                                    resolve(true)
                                }).catch(err => reject(err))
                            }
                        }).catch(err => {
                            reject(err);
                        });

                    }
                } else {
                    this.db['listcallfiles'].update({
                        updated_at: moment(new Date()), processing_status : {
                            "nbr_callfiles": 0,
                            "nbr_uploaded_callfiles": 0,
                            "nbr_duplicated_callfiles": 0
                        }}, {where: {listcallfile_id: listCallfile_id, active: 'Y'}}).then(() => {
                        resolve(true)
                    }).catch(err => reject(err))
                }
            })
        })
    }

    cronListCallFiles() {
        return new Promise((resolve, reject) => {
            this.db['listcallfiles'].findAll({
                where: {
                    active: 'Y',
                    processing: 0
                }
            }).then(dataListCallFiles => {
                if (dataListCallFiles.length === 0) {
                    resolve({message: "everything is okey nothing to add !", cron: "cronListCallFiles"})
                }
                let Camp_ids = [];
                let idxLCF = 0;
                dataListCallFiles.forEach(ListCallFile_item => {
                    if (!Camp_ids.includes(ListCallFile_item.campaign_id)) {
                        Camp_ids.push(ListCallFile_item.campaign_id);
                    }
                    if (!!!ListCallFile_item.sql_list_id) {
                        this.getPhoneNumberAttribute(ListCallFile_item).then(Phone_Attribute => {
                            this.getCallFiles(ListCallFile_item.file_id).then(data => {
                                this.updateNumberCallFiles(ListCallFile_item.listcallfile_id).then(() => {
                                    this.CallFiles_Mapping(ListCallFile_item, data.data, Phone_Attribute).then((datax) => {
                                        if (idxLCF < dataListCallFiles.length - 1) {
                                            idxLCF++;
                                        } else {
                                            appSocket.emit('refresh_list_callFiles', {campaign_ids: Camp_ids});
                                            resolve({
                                                message: `Done for : ${ListCallFile_item.name}| ID : ${ListCallFile_item.listcallfile_id}| Error : ${data.message} | Total : ${datax.total} | Added : ${datax.added} | Deplicated : ${datax.deplicated} | PhoneNumber (Not found or incorrect) : ${datax.phoneAttributeNotFound}`,
                                                cron: "cronListCallFiles"
                                            })
                                        }
                                    }).catch(err => {
                                        reject(err)
                                    })
                                }).catch(err => reject(err))
                            }).catch(err => reject(err))
                        }).catch(err => reject(err))
                    } else {
                        this.updateNumberCallFiles(ListCallFile_item.listcallfile_id).then(() => {
                            this._getCallFilesBySqlListID(ListCallFile_item.sql_list_id, ListCallFile_item.listcallfile_id).then(() => {
                                if (idxLCF < dataListCallFiles.length - 1) {
                                    idxLCF++;
                                } else {
                                    appSocket.emit('refresh_list_callFiles', {campaign_ids: Camp_ids});
                                    resolve({
                                        message: `Done for : ${ListCallFile_item.name}, ID : ${ListCallFile_item.listcallfile_id}`,
                                        cron: "cronListCallFiles"
                                    })
                                }
                            })
                        })
                    }
                })
            }).catch(err => reject(err))
        })
    }
}

module.exports = AddCallFile
