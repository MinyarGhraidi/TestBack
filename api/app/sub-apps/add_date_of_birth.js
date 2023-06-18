const db = require("../models");
getCallfiles = (listleads_id, index, limit, offset) => {
    return new Promise((resolve,reject) => {
        let idx = 0;
        let sqlQuerySelectListLeads_list = `select phone_number, date_of_birth from vicidial_list where list_id = :list_cf_id and date_of_birth <> :date order by lead_id asc limit :limit offset :offset;`
        db.sequelize['crm-sql'].query(sqlQuerySelectListLeads_list, {
            type: db.sequelize['crm-sql'].QueryTypes.SELECT,
            replacements: {
                list_cf_id: listleads_id,
                date : "0000-00-00",
                limit,
                offset
            }
        }).then(callfiles => {
            console.log("=================================+> ",callfiles.length)
            if(callfiles && callfiles.length !== 0){
                for (const callfile of callfiles) {
                    let sqlUpdate = `UPDATE callfiles SET date_of_birth = :date_of_birth where phone_number = :phone_number;`
                    db.sequelize['crm-app'].query(sqlUpdate, {
                        type: db.sequelize['crm-app'].QueryTypes.UPDATE,
                        replacements: {
                            date_of_birth: callfile.date_of_birth,
                            phone_number: callfile.phone_number
                        }
                    }).then(() => {
                        if (idx < callfiles.length - 1) {
                            idx++;
                            console.log(`idx : ${idx} / ${callfiles.length} ---> INDEX : ${index} ----> ID : ${listleads_id} -----> LIMIT : ${limit}  ----> OFFSET : ${offset}`)
                        } else {
                            resolve("donnnnnne")
                        }
                    }).catch(err => {
                        reject(err)
                    })
                }
            }else{
                resolve("doneeeeeeeeeeeeeee without callfiles")
            }
        }).catch(err => {
            reject(err)
        })
    })

}

cronsAdd = async () => {
    // ####### ListLead !! 19001 have 68136 Callfiles
    // ####### ListLead !! 31052023 have 111713 Callfiles
    await getCallfiles(19001, 0, 40000, 0);
    await getCallfiles(19001, 0, 40000, 40000);
    await getCallfiles(31052023, 1, 40000, 0);
    await getCallfiles(31052023, 1, 40000, 40000);
    await getCallfiles(31052023, 1, 40000, 80000);
}
cronsAdd()