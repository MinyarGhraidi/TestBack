const {Client} = require('node-scp')
const {baseModelbo} = require("../../bo/basebo");
const db = require("../../models");
const moment = require("moment");
const dbcdr = require("../../models/acc_cdrs/models");
const { exec } = require("child_process");


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
                    Client({
                        host: '5.135.68.123',
                        port: 22,
                        username: 'root',
                        password: 'Oxilog2020.',
                    }).then(client => {
                        let index = 0
                        datacdrRecords.forEach((item_cdr, i) => {
                            client.downloadFile(
                                item_cdr.record_url,
                                '/var/www/crm/crm-backend/api/app/recordings/' + item_cdr.memberUUID + '.wav',
                            )
                                .then(response => {
                                    let cmd_ffmpeg = ' ffmpeg -i /var/www/crm/crm-backend/api/app/recordings/' + item_cdr.memberUUID + '.wav -vn -ar 44100 -ac 2 -b:a 192k ' + '/var/www/crm/crm-backend/api/app/recordings/' + item_cdr.memberUUID + '.mp3'
                                    exec(cmd_ffmpeg, (error, stdout, stderr) => {
                                        dbcdr['acc_cdrs'].update({is_treated: 'Y'}, {
                                            where: {
                                                id: item_cdr.id
                                            }
                                        }).then(call_updated => {
                                            this.db["calls_historys"].update({record_url: 'https://crm-back-demo.oxilog.net/api/callHistory/play/'+item_cdr.memberUUID}, {
                                                where: {
                                                    uuid: item_cdr.memberUUID,
                                                    active: 'Y'
                                                }
                                            })
                                                .then(() => {
                                                    let cmd_delete = 'rm -rf ' +'/var/www/crm/crm-backend/api/app/recordings/' + item_cdr.memberUUID + '.wav'
                                                    exec(cmd_delete, (error, stdout, stderr) => {
                                                        if (index <= datacdrRecords.length - 1) {
                                                            index++
                                                        } else {
                                                            resolve(true)
                                                        }
                                                    })
                                                })
                                        }).catch(err => {
                                            console.log(err)
                                        })
                                    });

                                })
                                .catch(error => {
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