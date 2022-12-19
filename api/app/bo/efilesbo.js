const {baseModelbo} = require('./basebo');
let db = require('../models');
const {appDir} = require("../helpers/app");
const EFile = db.efiles;
const fs = require('fs');
const csv = require('csvtojson');
const xlsx = require("xlsx")
const path = require("path");
class efiles extends baseModelbo {
    constructor() {
        super('efiles', 'file_id');
        this.baseModal = "efiles";
        this.primaryKey = 'file_id';
    }

    upload(req, res, next) {
        if (!req.file) {
            return res.send({msg: 'File not exists'});
        } else {
            EFile.create({
                file_title: req.query.category,
                file_type: req.file.mimetype,
                file_name: req.file.filename,
                original_name: req.file.originalname,
                file_size: req.file.size,
                uri: req.file.destination + req.file.filename + '.' + req.file.originalname.split('.').pop(),
                created_at: Date.now(),
                updated_at: Date.now(),
                file_extension: req.file.originalname.split('.').pop()
            }).then((row) => {
                if (row.file_id) {
                    let extension = req.file.originalname.split('.').pop()
                    const new_file_name = 'efile-' + row.file_id + '.' + extension;
                    let dirType = "callfiles"
                    if (extension === "mp3" || extension === "wav") {
                        dirType = "audios"
                    }
                    const file_uri = '/public/upload/' + dirType + "/" + new_file_name;
                    EFile.update({file_name: new_file_name, uri: file_uri},
                        {
                            where: {
                                file_name: req.file.filename
                            }
                        }).then(result => {
                        fs.rename(req.file.path, appDir + '/app/resources/efiles' + file_uri, (err) => {
                            if (err) throw err;
                        });
                    });
                    res.send({
                        success: true,
                        data: row.file_id,
                        messages: ['File uploaded with success']
                    });
                } else {
                    res.send({
                        success: true,
                        data: row.file_id,
                        messages: ['Error upload file']
                    });
                }
            }).catch(err => {
                res.send({msg: 'Error', detail: err});
            });
        }
    }

    return_default_image(res) {
        const file_path = appDir + '/app/resources/assets/images/no-image.png';
        res.sendFile(file_path);
    }

    getImageByStyle(req, res, next) {
        let _this = this;
        if (!parseInt(req.params.file_id)) {
            return this.return_default_image(res);
        }
        EFile.findById(req.params.file_id).then(efile => {
            if (!efile) {
                this.return_default_image(res);
            } else {
                const file_path = appDir + '/app/resources/efiles/' + efile.uri;
                if (fs.existsSync(file_path)) {
                    res.sendFile(file_path);
                } else {
                    this.return_default_image(res);
                }
            }
        }).catch(err => {
            _this.sendResponseError(res,['Error get data file'])
        });
    }

    getListCallFiles(req, res, next) {
        let result = [];
        if (parseInt(req.params.file_id)) {

            EFile.findById(req.params.file_id).then(efile => {

                if (efile) {
                    let path = appDir + '/app/resources/efiles' + efile.uri

                    if (efile.file_extension === 'csv' || efile.file_extension === 'xls') {
                        if (fs.existsSync(path)) {
                            csv({
                                noheader: true,
                                delimiter: [',', ';']
                            })
                                .fromFile(path)
                                .then((jsonObj) => {
                                    result = jsonObj;
                                    res.send(result);
                                })
                        }
                    }
                } else {
                    res.send({
                        status: 200,
                        success: true,
                        messages: ({
                            internal_message: 'file not exist'
                        })
                    })
                }
            });
        }

    }

    getHeaderCallFile(req, res, next) {
        let {file_id} = req.body;
        if (file_id) {
            EFile.findById(file_id).then(efile => {
                if (efile) {
                    let path = appDir + '/app/resources/efiles' + efile.uri;
                    if (efile.file_extension === 'csv' || efile.file_extension === 'xls' || efile.file_extension === 'xlsx') {
                        if (fs.existsSync(path)) {
                            const workbookHeaders = xlsx.readFile(path, {sheetRows: 1});
                            const headers = Object.values(Object.values(workbookHeaders.Sheets)[0]).map(el => el.v);
                            res.send({
                                status: 200,
                                success: true,
                                messages: "Success",
                                data: headers
                            })
                        } else {
                            res.send({
                                status: 200,
                                success: true,
                                messages: ({
                                    internal_message: 'file not exist'
                                })
                            })
                        }
                    } else {
                        res.send({
                            status: 200,
                            success: true,
                            messages: ({
                                internal_message: 'file not exist'
                            })
                        })
                    }
                } else {
                    res.send({
                        status: 200,
                        success: true,
                        messages: ({
                            internal_message: 'file not exist'
                        })
                    })
                }
            });
        }

    }
    checkFile(files_ids,account_id = null){
        return new Promise((resolve,reject)=>{
            const dir_audios = path.join(__dirname, "../resources/efiles")
            let whereAudios = {};
            let idx = 0;
            if(files_ids && files_ids.length !== 0){
                files_ids.forEach((efile_id)=>{
                    account_id ? whereAudios = {audio_id : efile_id, active : 'Y',account_id : account_id} : {audio_id : efile_id, active : 'Y'};
                    this.db['audios'].findOne({where : whereAudios}).then(audio =>{
                        if(!!!audio){
                            resolve({
                                success : false
                            });
                        }
                        let file_id = audio.file_id;
                        this.db['efiles'].findOne({where : {file_id : file_id, active : 'Y'}}).then(async (file) => {
                            if (!!!file) {
                                resolve({
                                    success : false
                                });
                            }
                           let file_url = dir_audios + file.uri;
                            try {
                                await fs.promises.access(file_url);
                                if (idx < files_ids.length - 1) {
                                    idx++
                                } else {
                                    resolve({
                                        success : true,
                                        dir_file : file_url
                                    })
                                }
                            } catch (error) {
                                resolve({
                                    success : false
                                });
                            }
                        }).catch(err => resolve({
                            success : false
                        }))
                    }).catch(err => resolve({
                        success : false
                    }))
                })
            }else{
                resolve(false);
            }

        })
    }
}

module.exports = efiles;
