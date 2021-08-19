const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
const { appDir } = require("../helpers/app");
const EFile = db.efiles;
const mime = require('mime');
const path = require('path');
const fs = require('fs')
const csv=require('csvtojson')

class efiles extends baseModelbo {
    constructor() {
        super('efiles', 'file_id');
        this.baseModal = "efiles";
        this.primaryKey = 'file_id';
    }
    upload(req, res, next) {
        console.log('upload',req.file)
        if (!req.file) {
            return res.json({msg:'File not exists' });
            
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
                    let dirType ="callfiles"
                    if(extension =="mp3" || extension =="wav") {
                       dirType ="audios"
                    }
                    const file_uri = '/public/upload/' + dirType + "/" + new_file_name;

                    EFile.update({file_name: new_file_name, uri: file_uri},
                        {
                            where: {
                                file_name: req.file.filename
                            }
                        }).then();

                    fs.rename(req.file.path, appDir + '/app/resources/efiles' + file_uri, (err) => {
                        if (err) throw err;
                        console.log('Successfully move file');
                    });

                    res.json({
                        success: true,
                        data: row.file_id,
                        messages: ['File uploaded with success']
                    });

                }
            }).catch(err => {
                res.json({msg: 'Error', detail: err});
            });
        }
    }

    return_default_image(res) {
        const file_path = appDir + '/app/resources/assets/images/no-image.jpg';
        res.sendFile(file_path);
    }

    getImageByStyle(req, res, next) {
        if (!parseInt(req.params.file_id)) {
            return this.return_default_image(res);
        }

        EFile.findById(req.params.file_id).then(efile => {
            if (!efile) {
                this.return_default_image(res)
            } else {
                const file_path = appDir + '/app/resources/efiles/' + efile.uri;
                if (fs.existsSync(!path)) {
                    this.return_default_image(res)
                } else {
                    res.sendFile(file_path);
                }
            }
        });
    }

    getListCallFiles(req, res, next) {
        let result = [];
        if (parseInt(req.params.file_id)) {
           
            EFile.findById(req.params.file_id).then(efile => {
               
                if (efile) {
                    let path = appDir + '/app/resources/efiles' + efile.uri
                    
                    if(efile.file_extension=='csv')
                    {
                        console.log(efile);
                        if (fs.existsSync(path)) {
                            csv({
                                noheader:true,
                                delimiter:[',',';']
                            })
                            .fromFile(path)
                            .then((jsonObj)=>{
                                result = jsonObj;
                                res.send(result);
                            })
                        }
                    }
                } 
            });
        }
        
    }
}

module.exports = efiles;