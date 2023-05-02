const {Client} = require('node-scp')
const {baseModelbo} = require("../../bo/basebo");
const db = require("../../models");
const moment = require("moment");
const { exec } = require("child_process");
const env = process.env.NODE_ENV || 'development';
const callCenterCrdt = require(__dirname + '/../../config/config.json')[env]["callCenterCrdt"];

class MigrateRecords extends baseModelbo {
    migrateRecords() {
        return new Promise((resolve, reject) => {
            console.log('start migrate')
            let current_date = moment(new Date()).format('YYYY-MM-DD')
            let SqlGetCDrNotTreated = `select *
                                       from acc_cdrs
                                       where is_treated = 'N'
                                         AND record_url <> ''
                                         and durationsec <> '0'
                                         and start_time like :current_date limit 50`
            db.sequelize['cdr-db'].query(SqlGetCDrNotTreated, {
                type: db.sequelize['cdr-db'].QueryTypes.SELECT,
                replacements: {
                    current_date: current_date.toString().concat('%')
                }
            }).then(datacdrRecords => {
                let PromiseDownload = new Promise((resolve, reject) => {
                    Client(callCenterCrdt).then(client => {
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
                                                                   where
                                                                     id = :id `
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
                                })  .catch(error => {
                                console.log(error)
                            })
                        })
                    }).catch(e => console.log(e))
                })
                Promise.all([PromiseDownload]).then(data_cdr => {
                    Client.close()
                })
            })
        })
    }
}

module.exports = MigrateRecords
