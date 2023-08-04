const db = require("../../models");
const {baseModelbo} = require("../../bo/basebo");

class DeleteHooper extends baseModelbo {

    deleteHooper() {
        return new Promise((resolve, reject) => {
              const sql_hooper =`delete FROM hoopers
                     WHERE NOW() - treated_at > INTERVAL :interval and to_treat = :treated;`
            db.sequelize['crm-app'].query(sql_hooper,{
                type: db.sequelize['crm-app'].QueryTypes.DELETE,
                replacements: {
                    interval : '15 minutes',
                    treated : 'Y'
                }
            }).then(() => {
                resolve({message : " Hooper Deleted !"})
            }).catch(err => reject(err))
        })
    }
}

module.exports = DeleteHooper
