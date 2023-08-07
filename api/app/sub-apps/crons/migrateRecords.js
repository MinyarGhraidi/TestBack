const {Client} = require('node-scp')
const {baseModelbo} = require("../../bo/basebo");
const db = require("../../models");
const moment = require("moment");
const {exec} = require("child_process");
const PromiseBB = require("bluebird");
const env = process.env.NODE_ENV || 'development';
const callCenterCrdt = require(__dirname + '/../../config/config.json')[env]["callCenterCrdt"];

class MigrateRecords extends baseModelbo {
    migrateRecords() {
        return new Promise((resolve, reject) => {
            console.log('start migrate')
            let current_date = moment(new Date()).format('YYYY-MM-DD')
            let includes = [{
                model: db.domains ,include:[{
                    model: db.esl_servers,
                    required: false
                }],
                required: false
            }]
            this.db["accounts"].findAll({
                include: includes,
                where: {
                    status: 'Y',
                    active: 'Y'
                }
            })
                .then((accounts) => {
                    if(accounts && accounts.length !==0) {
                        PromiseBB.each(accounts, item_ac => {
                            let data_ac = item_ac.toJSON()
                            if(data_ac && data_ac.domain && data_ac.domain.esl_server && data_ac.domain.esl_server.crdt) {
                                let SqlGetCDrNotTreated = `select *
                                                       from acc_cdrs
                                                       where is_treated = 'N'
                                                         AND record_url <> ''
                                                         and durationsec <> '0'
                                                          and     SUBSTRING("custom_vars", 0 , POSITION(':' in "custom_vars") ) = :account_code
                                                         and start_time like :current_date limit 100`
                                db.sequelize['cdr-db'].query(SqlGetCDrNotTreated, {
                                    type: db.sequelize['cdr-db'].QueryTypes.SELECT,
                                    replacements: {
                                       // current_date: current_date.toString().concat('%'),
                                        current_date: '2023-07-27%',
                                        account_code: item_ac.account_code
                                    }
                                }).then(datacdrRecords => {
                                    let PromiseDownload = new Promise((resolve, reject) => {
                                        Client(data_ac.domain.esl_server.crdt).then(client => {
                                            let index = 0
                                            datacdrRecords.forEach((item_cdr, i) => {
                                                client.downloadFile(
                                                    item_cdr.record_url,
                                                    '/var/www/crm/crm-backend/api/app/recordings/' + item_cdr.memberUUID + '.wav',
                                                )
                                                    .then(response => {
                                                        let cmd_ffmpeg = ' ffmpeg -i /var/www/crm/crm-backend/api/app/recordings/' + item_cdr.memberUUID + '.wav -vn -ar 44100 -ac 2 -b:a 192k ' + '/var/www/crm/crm-backend/api/app/recordings/' + item_cdr.memberUUID + '.mp3'
                                                        exec(cmd_ffmpeg, (error, stdout, stderr) => {
                                                            let SqlUpdateTreated = ` update acc_cdrs
                                                                                 set is_treated= 'Y'
                                                                                 where id = :id `
                                                            db.sequelize['cdr-db'].query(SqlUpdateTreated, {
                                                                type: db.sequelize['cdr-db'].QueryTypes.SELECT,
                                                                replacements: {
                                                                    id: item_cdr.id
                                                                }
                                                            }).then(updateCdr => {
                                                                this.db["calls_historys"].update({record_url: 'https://api.skycrm360.io/api/callHistory/play/' + item_cdr.memberUUID}, {
                                                                    where: {
                                                                        uuid: item_cdr.memberUUID,
                                                                        active: 'Y'
                                                                    }
                                                                })
                                                                    .then(() => {
                                                                        let cmd_delete = 'rm -rf ' + '/var/www/crm/crm-backend/api/app/recordings/' + item_cdr.memberUUID + '.wav'
                                                                        exec(cmd_delete, (error, stdout, stderr) => {
                                                                            if (index <= datacdrRecords.length - 1) {
                                                                                index++
                                                                            } else {
                                                                                resolve(true)
                                                                            }
                                                                        })
                                                                    }).catch(error => {
                                                                    console.log(error)
                                                                })

                                                            }).catch(error => {
                                                                console.log(error)
                                                            });

                                                        })
                                                    }).catch(error => {
                                                    console.log('err', error)
                                                })
                                            })
                                        }).catch(e => console.log(e))
                                    })
                                    Promise.all([PromiseDownload]).then(data_cdr => {
                                        Client.close()
                                    })
                                })
                            }
                        })
                    }

                }).catch(err => {
                    console.log(err)
            })
        })
    }
}

module.exports = MigrateRecords
