const {baseModelbo} = require('./basebo');
let db = require('../models');
const {appDir} = require("../helpers/app");
const EFile = db.efiles;
const fs = require('fs');
const csv = require('csvtojson');
const xlsx = require("xlsx");
const XLSX = require("xlsx");
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
            const uri = req.file.destination + req.file.filename + '.' + req.file.originalname.split('.').pop();
            EFile.create({
                file_title: req.query.category,
                file_type: req.file.mimetype,
                file_name: req.file.filename,
                original_name: req.file.originalname,
                file_size: req.file.size,
                uri,
                created_at: Date.now(),
                updated_at: Date.now(),
                file_extension: req.file.originalname.split('.').pop()
            }).then((row) => {
                if (row.file_id) {
                    let extension = req.file.originalname.split('.').pop();

                    const new_file_name = 'efile-' + row.file_id + '.' + extension;
                    let dirType = "callfiles"
                    if (extension === "mp3" || extension === "wav") {
                        dirType = "audios"
                    }
                    if(req.body && req.body.chat){
                        dirType = "chat"
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
            _this.sendResponseError(res, ['Error get data file'])
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

    allEqual = (arr) => arr.every(val => !!!val);

    checkOneFile(efile_id, account_id) {
        return new Promise((resolve, reject) => {
            const dir_audios = path.join(__dirname, "../resources/efiles")
            let whereAudios = {};

            whereAudios = account_id ? {audio_id: efile_id, active: 'Y', account_id: account_id} : {
                file_id: efile_id,
                active: 'Y'
            };
            this.db['audios'].findOne({where: whereAudios}).then(audio => {
                if (!!!audio) {
                    resolve({
                        success: false
                    });
                }
                let file_id = audio.file_id;
                if (!!!file_id) {
                    resolve({
                        success: false
                    })
                }
                this.db['efiles'].findOne({where: {file_id: file_id, active: 'Y'}}).then(async (file) => {
                    if (!!!file) {
                        resolve({
                            success: false
                        });
                    }

                    let file_url = dir_audios + file.uri;
                    try {
                        await fs.promises.access(file_url);
                        resolve({
                            success: true,
                            data: file_url,
                            audio_type: audio.audio_type
                        })
                    } catch (error) {
                        resolve({
                            success: false
                        });
                    }
                }).catch(err => resolve({
                    success: false
                }))
            }).catch(err => resolve({
                success: false
            }))
        })

    }

    checkFile(files_ids, checkType = "", account_id = null) {
        let data_res = {
            "hold_music": null,
            "greetings": null,
        }
        return new Promise((resolve, reject) => {
            let idxNull = 0;
            let idx = 0;
            if (this.allEqual(files_ids) && checkType === "SaveUpdate") {
                resolve({
                    success: true,
                    data: data_res
                })
            }
            if (files_ids && files_ids.length !== 0) {
                files_ids.forEach((efile_id) => {
                    if (!!!efile_id) {
                        idxNull++;
                    } else {
                        this.checkOneFile(efile_id, account_id).then((result) => {
                            if (result.success) {
                                data_res[result.audio_type] = result.data;
                            }
                        })
                    }
                    if (idx < files_ids.length - 1) {
                        idx++

                    } else {
                        if (files_ids && files_ids.length === 1) {
                            let fileUrl = data_res['hold_music'] ? data_res['hold_music'] : data_res['greetings']
                            resolve({
                                success: true,
                                data: fileUrl
                            })
                        } else {
                            resolve({
                                success: true,
                                data: data_res
                            })
                        }

                    }
                })
            } else {
                resolve({
                    success: false,
                });
            }

        })
    }

    downloadFile (req, res, next){
        let _this = this;
        let file_name = req.params.filename;
        if (file_name && file_name !== 'undefined') {
            const file = appDir + '/app/resources/efiles/public/upload/chat/' + file_name;

            res.download(file, function (err) {
                if (err) {
                    _this.sendResponseError(res, err);
                }
            })
        } else {
            res.send({
                success: false,
                message: 'invalid file name'
            })
        }
    }

}

module.exports = efiles;
