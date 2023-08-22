const {baseModelbo} = require('./basebo');
let db = require('../models');
const ObjectsToCsv = require('objects-to-csv');
const fs = require("fs");
const moment = require('moment');
const {appDir} = require("../helpers/app");

class listcallfiles extends baseModelbo {
    constructor() {
        super('listcallfiles', 'listcallfile_id');
        this.baseModal = "listcallfiles";
        this.primaryKey = 'listcallfile_id';
    }


    getStatsListCallFiles(req, res, next) {
        let _this = this;
        let {campaign_id, limit, page, fieldsSearchMetas, meta_key} = req.body;
        const _page = page || 1;
        const offset = ((limit || 10) * (_page - 1));
        if (!!!campaign_id) {
            _this.sendResponseError(res, ['Error.campaign_id is required'])
            return
        }
        let whereLike = '';
        if(fieldsSearchMetas && fieldsSearchMetas.length !== 0 && meta_key && meta_key !== '' && meta_key.length >= 3){
            fieldsSearchMetas.forEach(field => {
                let concatChamp = 'listCallf.'+field;
                whereLike += ` AND ${concatChamp} LIKE '%${meta_key}%'`
            })
        }
        let sqlStats = `SELECT listCallf.listcallfile_id                                  as id,
                               count(callf.*)                                             as total,
                               count(case when callf.to_treat = 'Y' then 1 else null end) as total_called,
                               count(case when callf.to_treat = 'N' then 1 else null end) as total_available
                        from public.listcallfiles as listCallf
                                 LEFT JOIN callfiles as callf
                                           on callf.listcallfile_id = listCallf.listcallfile_id and callf.active = 'Y'
                        WHERE listCallf.active = 'Y' and listCallf.campaign_id = :campaign_id WHERE_LIKE
                        GROUP by listCallf.listcallfile_id
                        ORDER by listCallf.listcallfile_id desc limit :limit offset :offset`
        sqlStats = sqlStats.replace('WHERE_LIKE',whereLike);
        db.sequelize['crm-app'].query(sqlStats,
            {
                type: db.sequelize['crm-app'].QueryTypes.SELECT,
                replacements: {
                    campaign_id: campaign_id,
                    limit,
                    offset
                }
            })
            .then(statsListCallFiles => {
                res.send({
                    data: statsListCallFiles,
                    campaign_id: campaign_id,
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
        this.db['listcallfiles'].findOne({where: {listcallfile_id: listCallfile_id, active: 'Y'}}).then(LCF => {
            if (!!!LCF) {
                return _this.sendResponseError(res, ['Error.cannotFindListCallFile'], 1, 403)
            }
            _this.getStatsCallStatusByLisCallFile(listCallfile_id, LCF.campaign_id).then(data_stats => {
                res.send({
                    data: data_stats,
                    status: 200,
                    success: true
                })
            }).catch(err => {
                _this.sendResponseError(res, ['Error get stats callFiles by callStatus'], err)
            })
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
                         from callstatuses
                                  left join (
                             SELECT code,
                                    count(call_f.*) as count_call_status
                             FROM callstatuses as call_s
                                      LEFT JOIN callfiles as call_f
                                                on call_f.call_status = call_s.code and call_f.to_treat = 'Y' and
                                                   call_f.active = :active
                                      LEFT JOIN listcallfiles as list_call_f
                                                on list_call_f.listcallfile_id = call_f.listcallfile_id and
                                                   list_call_f.active = :active and call_f.active = :active
                             WHERE call_s.active = :active
                          and ( call_s.is_system = 'Y' or call_s.campaign_id = :campaign_id)
                             GROUP by code) as all_s on all_s.code = callstatuses.code`
        db.sequelize['crm-app'].query(sql_stats,
            {
                type: db.sequelize['crm-app'].QueryTypes.SELECT,
                replacements: {
                    campaign_id: campaign_id,
                    active: 'Y',
                }
            })
            .then(statsListCallFiles => {
                let Filtered = statsListCallFiles.filter(stat => stat.count_call_status !== null)
                res.send({
                    success: true,
                    data: Filtered
                })
            }).catch(err => {
            _this.sendResponseError(res, ['Error get stats callFiles by callStatus'], err)
        })
    }

    getStatsCallStatusByLisCallFile(listCallfile_id, campaign_id) {
        return new Promise((resolve, reject) => {
            let sqlStats = `SELECT code, count(call_f.*) as count_call_status
                            FROM callstatuses as call_s
                                     LEFT JOIN callfiles as call_f
                                               on call_f.call_status = call_s.code and call_f.to_treat = :active and
                                                  call_f.active = :active and call_f.listcallfile_id = :listCallfile_id
                            WHERE call_s.active = :active
                            and ( call_s.is_system = 'Y' or call_s.campaign_id = :campaign_id)
                            GROUP by code`
            db.sequelize['crm-app'].query(sqlStats,
                {
                    type: db.sequelize['crm-app'].QueryTypes.SELECT,
                    replacements: {
                        listCallfile_id: listCallfile_id,
                        active: 'Y',
                        campaign_id: campaign_id
                    }
                })
                .then(statsListCallFiles => {
                    resolve(statsListCallFiles)
                }).catch(err => {
                reject(err)
            })
        })
    }

    async printCsv(data) {
        const csv = new ObjectsToCsv(data);
        const file_name = Date.now() + 'ListCallFileQualification.csv';
        const file_path = appDir + '/app/resources/qualificationListCallFile/' + file_name;
        await csv.toDisk(file_path);
        await csv.toString()
        return file_name
    }

    CallFileQualification(req, res, next) {
        let listClaFile_id = req.body.listcallfile_id;

        this.db['callfiles'].findAll({
            where: {
                listcallfile_id: listClaFile_id,
                active: 'Y'
            }
        }).then(listCalFile => {
            if (listCalFile && listCalFile.length !== 0) {
                let dataCall = listCalFile.map(item => {
                    delete item.dataValues.callfile_id
                    delete item.dataValues.listcallfile_id
                    delete item.dataValues.created_at
                    delete item.dataValues.updated_at
                    delete item.dataValues.to_treat
                    delete item.dataValues.save_in_hooper
                    delete item.dataValues.active
                    return item.dataValues
                })
                this.printCsv(dataCall).then(data => {
                    if (data) {
                        res.send({
                            file_name: data
                        })
                    } else {
                        this.sendResponseError(res, 'Error.printFile')
                    }
                }).catch(err => {
                    this.sendResponseError(res, 'Error.printFile')
                })
            } else {
                this.sendResponseError(res, 'Error.printFile')
            }
        }).catch(err => {
            this.sendResponseError(res, 'Error.printFile')
        })
    }

    downloadList(req, res, next) {
        let _this = this;
        let file_name = req.params.filename;
        if (file_name && file_name !== 'undefined') {
            const file = appDir + '/app/resources/qualificationListCallFile/' + file_name;
            res.download(file, function (err) {
                if (err) {
                    _this.sendResponseError(res, err);
                } else {
                    fs.unlink(file, function (err) {
                        if (err)
                            throw(err)
                    });
                }
            })
        } else {
            res.send({
                success: false,
                message: 'invalid file name'
            })
        }
    }

    cloneListCallFiles = (req, res, next) => {
        let _this = this;
        let {listCallFile_id, listCallFile_name, user_id, campaign_id} = req.body;

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
                let file_id = data_listCallFile_gp.file_id;
                this.db['efiles'].findById(file_id).then(efile => {
                    if (!efile) {
                        return res.send({
                            success: false,
                            message: "file-does-not-exit"
                        })
                    } else {
                        const file_path = appDir + '/app/resources/efiles' + efile.uri;
                        if (fs.existsSync(file_path)) {
                            this.db['callfiles'].findOne({
                                where: {
                                    listcallfile_id: listCallFile_id,
                                    active: 'Y'
                                }
                            }).then(callfiles => {
                                if (callfiles && callfiles.length !== 0) {
                                    data_listCallFile_gp.name = listCallFile_name;
                                    data_listCallFile_gp.campaign_id = campaign_id;
                                    data_listCallFile_gp.created_at = moment(new Date());
                                    data_listCallFile_gp.updated_at = moment(new Date());
                                    data_listCallFile_gp.processing = 0;
                                    data_listCallFile_gp.processing_status =
                                        {
                                            nbr_callfiles: 0,
                                            nbr_uploaded_callfiles: 0,
                                            nbr_duplicated_callfiles: 0
                                        };
                                    delete data_listCallFile_gp['listcallfile_id'];
                                    const ListCallFileModel = db['listcallfiles'];
                                    let list_CallFile = ListCallFileModel.build(data_listCallFile_gp);
                                    list_CallFile.save(data_listCallFile_gp).then(() => {
                                        return res.send({
                                            success: true,
                                        })
                                    }).catch(err => {
                                        _this.sendResponseError(res, err)
                                    })
                                } else {
                                    return res.send({
                                        success: false,
                                        message: "no-leads-in-cloned-list-leads"
                                    })
                                }
                            })


                        } else {
                            return res.send({
                                success: false,
                                message: "file-does-not-exit"
                            })
                        }
                    }
                }).catch(err => {
                    _this.sendResponseError(res, ['Error get data file'])
                });
            } else {
                res.send({
                    success: false,
                    data: [],
                    message: 'list-leads-not-found'
                })
            }

        })

    }
    checkCampaign = (campaign_id, status) => {
        return new Promise((resolve, reject) => {
            if (status === 'N') {
                return resolve(true)
            }
            if (campaign_id) {
                this.db['campaigns'].findOne({
                    where: {
                        status: 'Y',
                        active: 'Y',
                        campaign_id: campaign_id
                    }
                }).then(campaign => {
                    if (!!!campaign) {
                        resolve(false)
                    } else {
                        resolve(true)
                    }
                }).catch(err => reject(err))
            } else {
                resolve(false)
            }
        })
    }
    checkTemplate = (template_id, status) => {
        return new Promise((resolve, reject) => {
            if (status === 'N') {
                return resolve({
                    success: true
                })
            }
            if (template_id) {
                this.db['templates_list_call_files'].findOne({
                    where: {
                        status: 'Y',
                        active: 'Y',
                        templates_list_call_files_id: template_id
                    }
                }).then(template => {
                    if (!!!template) {
                        resolve({
                            success: false,
                            message: "list-leads-without-template"
                        })
                    } else {
                        resolve({
                            success: true
                        })
                    }
                }).catch(err => reject(err))
            } else {
                resolve({
                    success: true
                })
            }
        })
    }

    _changeStatusLCF = (listcallfile_id, status) => {
        return new Promise((resolve, reject) => {
            this.db['listcallfiles'].update({
                status: status,
                updated_at: moment(new Date())
            }, {where: {listcallfile_id: listcallfile_id, active: 'Y'}}).then(() => {
                    if (status === 'N') {
                        this._deleteFromHooperByCallfileID(listcallfile_id).then(() => {
                            return resolve({
                                success: true
                            })
                        }).catch(err => reject(err))
                    } else {
                        resolve({
                            success: true
                        })
                    }
            }).catch(err => reject(err))
        })
    }
    _changeStatus = (listcallfile_id, status) => {
        return new Promise((resolve, reject) => {
            this.db['listcallfiles'].findOne({where: {listcallfile_id: listcallfile_id}}).then(lcf => {
                let template_id = lcf.templates_id
                let campaign_id = lcf.campaign_id
                if (lcf && Object.keys(lcf).length !== 0) {
                    this.checkCampaign(campaign_id, status).then(resultCheckCampaign => {
                        if (resultCheckCampaign) {
                            this.checkTemplate(template_id, status).then(resultCheckTemplate => {
                                if (resultCheckTemplate.success) {
                                    this._changeStatusLCF(listcallfile_id, status).then(() => {
                                        resolve({
                                            success: true
                                        })
                                    }).catch(err => reject(err))
                                } else {
                                    return resolve({
                                        success: false,
                                        message: resultCheckTemplate.message
                                    })
                                }
                            })
                        } else {
                            return resolve({
                                success: false,
                                message: "campaign-not-activated"
                            })
                        }
                    }).catch(err => {
                        return this.sendResponseError(res, ["CampaignNotFound", err], 1, 403)
                    })

                } else {
                    return reject('listcallfile not found')
                }
            })

        })
    }
    changeStatus = (req, res, next) => {
        const {listcallfile_id, status} = req.body
        if (!!!listcallfile_id) {
            return this.sendResponseError(res, ['emptyBody'], 1, 403)
        }
        this._changeStatus(listcallfile_id, status).then((data) => {
            res.send({
                status: 200,
                success: data.success,
                message: data.message
            })
        }).catch(err => {
            return this.sendResponseError(res, ['ErrorChangeStatus', err], 2, 403)
        })
    }
}

module.exports = listcallfiles;
