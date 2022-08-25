const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
const ObjectsToCsv = require('objects-to-csv');
const path = require('path');
const fs = require("fs");
const appDir = path.dirname(require.main.path);

class listcallfiles extends baseModelbo {
    constructor() {
        super('listcallfiles', 'listcallfile_id');
        this.baseModal = "listcallfiles";
        this.primaryKey = 'listcallfile_id';
    }
    getStatsListCallFiles(req, res, next) {
        let _this = this;
        let sqlStats = `select listCallf.listcallfile_id as id , count(callf.*) as total, count(callfC.*) as total_called, count(callfA.*) as total_available from  public.listcallfiles as listCallf
                        left join callfiles as callf on callf.listcallfile_id = listCallf.listcallfile_id and callf.active='Y'
                        left join callfiles as callfC on callfC.callfile_id = listCallf.listcallfile_id and callfC.to_treat = 'Y' and  callfC.active='Y'
                        left join callfiles as callfA on callfA.callfile_id = listCallf.listcallfile_id and callfA.to_treat = 'N' and callfA.active='Y'
                        where listCallf.active= 'Y' 
                        group by listCallf.listcallfile_id
                        order by listCallf.listcallfile_id desc`
        db.sequelize.query(sqlStats,
            {
                type: db.sequelize.QueryTypes.SELECT,
            })
            .then(statsListCallFiles => {
                res.send({
                    data: statsListCallFiles,
                    status: 200,
                    success :true
                })
            }).catch(err => {
                _this.sendResponseError(res,['Error get stats callFiles'], err)
        })
    }

    async  printCsv(data) {
        const csv = new ObjectsToCsv(data);
        const file_name = Date.now() + 'ListCallFileQualification.csv';
        const file_path = appDir + '/api/app/resources/QualificationListCallFile/' + file_name;
        await csv.toDisk(file_path);
        await csv.toString()
        return  file_name
    }

     CallFileQualification (req, res, next){
        let listClaFile_id = req.body.listcallfile_id;

        this.db['callfiles'].findAll({
            where:{
                listcallfile_id:listClaFile_id,
                active: 'Y'
            }
        }).then(listCalFile =>{

            if(listCalFile && listCalFile.length !== 0){
                let dataCall = listCalFile.map(item=>{
                    delete item.dataValues.callfile_id
                    delete item.dataValues.listcallfile_id
                    delete item.dataValues.created_at
                    delete item.dataValues.updated_at
                    delete item.dataValues.to_treat
                    delete item.dataValues.save_in_hooper
                    delete item.dataValues.active
                    return item.dataValues
                })
                this.printCsv(dataCall).then(data=>{
                    if( data){
                        res.send({
                            file_name: data
                        })
                    }

                })
            }
        })
    }

    downloadList(req, res, next) {
        let _this = this;
        let file_name = req.params.filename;
        if (file_name && file_name !== 'undefined') {
             const file = appDir + '/api/app/resources/QualificationListCallFile/' + file_name;
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
}

module.exports = listcallfiles;
