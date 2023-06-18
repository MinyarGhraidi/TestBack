const moment = require("moment/moment");
const db = require("../models");
const env = process.env.NODE_ENV || 'development';
const config_camps = require(__dirname + '/../config/config.json')[env]["config_camps"];

importCampaign = (sql_campaign_id, campaign_id) => {
    return new Promise((resolve, reject) => {
        let Date_TZ = moment().format("YYYY-MM-DD HH:mm:ss");
        let sqlQuerySelectListLeads = `select list_id, list_name, list_description from vicidial_lists where campaign_id = :sql_campaign_id;`
        let sqlQueryInsert = `INSERT INTO listcallfiles (name, description, campaign_id, active, file_id, status,
                                                                                         mapping, processing, processing_status, check_duplication,
                                                                                         prefix, created_at, updated_at, templates_id, custom_fields,
                                                                                         sql_list_id)
                                                              VALUES (:name,
                                                                      :description,
                                                                      :campaign_id,
                                                                      :activeStatus,
                                                                      null,
                                                                      :activeStatus,
                                                                      :mapping,
                                                                      0,
                                                                      null,
                                                                      0,
                                                                      33,
                                                                      :date,
                                                                      :date,
                                                                      null,
                                                                      null,
                                                                      :sql_list_id);`

        let mapping = {
            "phone_number": "phone_number",
            "title": "title",
            "first_name": "first_name",
            "middle_initial": "middle_initial",
            "last_name": "last_name",
            "address1": "address1",
            "city": "city",
            "state": "state",
            "province" : "province",
            "postal_code" : "postal_code",
            "country_code": "country_code",
            "gender" : "gender",
            "email": "email",
            "date_of_birth" : "date_of_birth",
            "comments" : "comments"
        }
        const jsonStringMapping = JSON.stringify(mapping);

        db.sequelize['crm-sql'].query(sqlQuerySelectListLeads, {
            type: db.sequelize['crm-sql'].QueryTypes.SELECT,
            replacements: {
                sql_campaign_id: sql_campaign_id
            }
        }).then(listCallFiles => {
            if (listCallFiles && listCallFiles.length !== 0) {
                let indx = 0;
                listCallFiles.forEach(list => {
                    db.sequelize['crm-app'].query(sqlQueryInsert, {
                        type: db.sequelize['crm-app'].QueryTypes.INSERT,
                        replacements: {
                            name: list.list_name,
                            description: list.list_description,
                            campaign_id: campaign_id,
                            date: Date_TZ,
                            sql_list_id: list.list_id,
                            activeStatus: "Y",
                            mapping : jsonStringMapping
                        }
                    }).then(() => {
                        if (indx < listCallFiles.length - 1) {
                            indx++;
                        } else {
                            db['campaigns'].update({
                                sql_campaign_id: sql_campaign_id,
                                updated_at: moment(new Date())
                            }, {where: {campaign_id: campaign_id}}).then(() => {
                                return resolve(true)
                            }).catch(err => {
                                return reject(err)
                            })

                        }

                    }).catch(err => {
                        return reject(err)
                    })
                })
            }
        })
    })
}
mappingCampaigns = () => {
        let Conf_campaigns = config_camps;
        let result = {};
        let idx = 0;
        if (!!!Conf_campaigns || Object.keys(Conf_campaigns).length === 0) {
            result['error'] = "config without campaigns"
            console.log(result)
        } else {
            for (const [camp, vicidial_camp] of Object.entries(Conf_campaigns)) {
                db['campaigns'].findOne({where: {active: 'Y', campaign_name: camp}}).then(campaign => {
                    if (!!!campaign) {
                        result[camp] = `${camp} not created yet`
                        if (idx < Object.keys(Conf_campaigns).length - 1) {
                            idx++;
                        } else {
                            console.log(result)
                        }
                    } else {
                        if (campaign.sql_campaign_id) {
                            result[camp] = `${camp} already imported !`
                            if (idx < Object.keys(Conf_campaigns).length - 1) {
                                idx++;
                            } else {
                                console.log(result)
                            }
                        } else {
                            let sqlQuerySelect = `select campaign_id from vicidial_campaigns where campaign_name = :sql_campaign_name;`
                            db.sequelize['crm-sql'].query(sqlQuerySelect, {
                                type: db.sequelize['crm-sql'].QueryTypes.SELECT,
                                replacements: {
                                    sql_campaign_name: vicidial_camp
                                }
                            }).then(vicidial_campaign => {
                                if (vicidial_campaign.length === 0) {
                                    result[vicidial_camp] = `${vicidial_camp} not created yet`
                                    if (idx < Object.keys(Conf_campaigns).length - 1) {
                                        idx++;
                                    } else {
                                        console.log(result)
                                    }
                                } else {
                                    importCampaign(vicidial_campaign[0].campaign_id, campaign.campaign_id).then(() => {
                                        result[camp] = `${camp} Imported !`
                                        if (idx < Object.keys(Conf_campaigns).length - 1) {
                                            idx++;
                                        } else {
                                            console.log(result)
                                        }
                                    }).catch(err => {
                                        console.log("Error Importing Campaign => ",err)
                                    })

                                }
                            }).catch(err => {
                                console.log("Error Selecting vicidial_campaign => ",err)
                            })
                        }
                    }
                })
            }
        }
}

mappingCampaigns()
