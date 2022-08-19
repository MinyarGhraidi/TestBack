const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
 
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
}

module.exports = listcallfiles;
