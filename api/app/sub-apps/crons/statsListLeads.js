const moment = require("moment/moment");
const db = require("../../models");
const {baseModelbo} = require("../../bo/basebo");

class StatsListLeads extends baseModelbo {

    getAllStatsListcallFiles() {
        return new Promise((resolve, reject) => {
            let sqlStats = `SELECT listCallf.listcallfile_id                                  as id,
                               count(callf.*)                                             as total,
                               count(case when callf.to_treat = 'Y' then 1 else null end) as total_called,
                               count(case when callf.to_treat = 'N' then 1 else null end) as total_available
                        from public.listcallfiles as listCallf
                                 LEFT JOIN callfiles as callf
                                           on callf.listcallfile_id = listCallf.listcallfile_id
                        WHERE listCallf.active = 'Y'
                        GROUP by listCallf.listcallfile_id`
            db.sequelize['crm-app'].query(sqlStats,
                {
                    type: db.sequelize['crm-app'].QueryTypes.SELECT
                }).then(data => {
                resolve(data)
            }).catch(err => reject(err))
        })
    }

    statsListLeads() {
        return new Promise((resolve, reject) => {
            this.getAllStatsListcallFiles().then(data => {
                let idx = 0;
                if (data && data.length !== 0) {
                    data.forEach(stat_lcf => {
                        let stats = {
                            total: stat_lcf.total,
                            total_called: stat_lcf.total_called,
                            total_available: stat_lcf.total_available
                        }
                        this.db['listcallfiles'].update({
                            updated_at: moment(new Date()),
                            stats: stats
                        }, {where: {listcallfile_id: stat_lcf.id, active: 'Y'}}).then(() => {
                            if(idx < data.length -1){
                                idx++;
                            }else{
                                return resolve({
                                    message : data.length +' listcallfiles updated !'
                                })
                            }
                        }).catch(err => reject(err))
                    })
                } else {
                    resolve({message: 'there are no listcallfiles'})
                }
            })
        })
    }
}

module.exports = StatsListLeads
