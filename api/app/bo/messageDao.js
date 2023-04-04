const {baseModelbo} = require('./basebo');
const db = require("../models");
const Op = require("sequelize/lib/operators");
const moment = require("moment");
const fs = require("fs");
const {appDir} = require("../helpers/app");

class messageDao extends baseModelbo {
    constructor() {
        super('messages', 'message_id');
        this.baseModal = 'messages';
        this.primaryKey = 'message_id';
    }

    getMessageChannelIDsByUserId(user_id) {
        return new Promise((resolve, reject) => {
            if(!!!user_id){
                reject(false)
            }
            this.db['message_channel_subscribers'].findAll({
                include: [{model: db.message_channels}], where: {
                    user_id: user_id, active: 'Y'
                }
            }).then((data) => {
                if (data && data.length !== 0) {
                    const filtering_S = data.filter(item => item.message_channel.channel_type === 'S')
                    let ids_S = [];
                    if (filtering_S && filtering_S.length !== 0) {
                        ids_S = filtering_S.map(filter => filter.message_channel_id)
                    }
                    const filtering_G = data.filter(item => item.message_channel.channel_type === 'G')
                    let ids_G = [];
                    if (filtering_G && filtering_G.length !== 0) {
                        ids_G = filtering_G.map(filter => filter.message_channel_id)
                    }
                    resolve({
                        channel_ids_S: ids_S, channel_ids_G: ids_G
                    })
                } else {
                    resolve({
                        channel_ids_S: [], channel_ids_G: []
                    })
                }
            }).catch(err => reject(err))
        })
    }

    getMessageIDsByChannelIDs(mc_id_s, user_id) {
        return new Promise((resolve, reject) => {
            this.db['messages'].findAll({
                where: {
                    active: 'Y', message_channel_id: {[Op.in]: mc_id_s}, created_by_id: user_id
                }
            }).then(data => {
                if (data && data.length !== 0) {
                    const res = data.map(m => m.message_id)
                    resolve(res)
                } else {
                    resolve([])
                }
            }).catch(err => reject(err))
        })
    }

    deleteCascadeMessagesByTableName(tableName, mc_id_sT, user_idT, mc_id_s, user_id) {
        return new Promise((resolve, reject) => {
            let WhereQuery = {}
            WhereQuery['active'] = 'Y'
            WhereQuery[mc_id_sT] = {[Op.in]: mc_id_s}
            WhereQuery[user_idT] = user_id
            this.db[tableName].update({updated_at: moment(new Date()), active: 'N'}, {
                where: WhereQuery
            }).then(() => {
                resolve(true)
            }).catch(err => reject(err))
        })
    }

    deleteMessageAttachments_Efiles(message_ids) {
        return new Promise((resolve, reject) => {
            if (message_ids.length === 0 || !!!message_ids) {
                return resolve(true)
            }
            this.db['message_attachments'].findAll({
                where: {
                    active: 'Y', message_id: {[Op.in]: message_ids}
                }
            }).then((messages) => {
                if (messages && messages.length !== 0) {
                    const attachment_efile_ids = messages.map(mes => mes.attachment_efile_id);
                    this.db['message_attachments'].update({updated_at: moment(new Date()), active: 'N'}, {
                        where: {
                            active: 'Y', message_id: {[Op.in]: message_ids}
                        }
                    }).then(() => {
                        this.deleteEfilesAttachments(attachment_efile_ids).then(() => {
                            resolve(true)
                        })
                    }).catch(err => reject(err))
                } else {
                    resolve(true)
                }
            }).catch(err => reject(err))
        })
    }

    deleteEfilesAttachments(attachment_efiles_ids) {
        return new Promise((resolve, reject) => {
            if (!!!attachment_efiles_ids || attachment_efiles_ids.length === 0) {
                return resolve(true)
            }

            this.db['efiles'].findAll({
                where: {active: 'Y', file_id: {[Op.in]: attachment_efiles_ids}}
            }).then(efiles => {
                if (efiles && efiles.length !== 0) {
                    let idx = 0;
                    const file_names = efiles.map(efile => efile.file_name);
                    this.db['efiles'].update({updated_at: moment(new Date()), active: 'N'}, {
                        where: {active: 'Y', file_id: {[Op.in]: attachment_efiles_ids}}
                    }).then(() => {
                        file_names.forEach(file_name => {
                            let file_path = appDir + '/app/resources/efiles/' + file_name;
                            console.log(file_path);
                              this.deleteFileIfExists(file_path).then(() => {
                            if (idx < file_names.length - 1) idx++; else resolve(true)
                              }).catch(err => reject(err))

                        })
                    }).catch(err => reject(err))
                } else resolve(true)

            }).catch(err => reject(err))
        })
    }

    deleteFileIfExists(file) {
        return new Promise((resolve, reject) => {
            if (fs.existsSync(file)) {
                fs.unlink(file, function (err) {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(true)
                    }
                });
            } else {
                resolve(true)
            }
        })
    }

    deleteMessages(message_ids) {
        return new Promise((resolve, reject) => {
            if (!!!message_ids || message_ids.length !== 0) {
                return resolve(true)
            }
            this.db['messages'].update({updated_at: moment(new Date()), active: 'N'}, {
                where: {
                    active: 'Y', message_id: {[Op.in]: message_ids}
                }
            }).then(() => {
                resolve(true)
            }).catch(err => reject(err))
        })
    }


    deleteMessageCascade(user_ids) {
        return new Promise((resolve,reject)=>{
            let idx = 0;
            user_ids.forEach(user_id => {
                this.getMessageChannelIDsByUserId(user_id).then(res_channel_ids => {
                    this.getMessageIDsByChannelIDs(res_channel_ids.channel_ids_S, user_id).then(res_message_ids => {
                        this.deleteCascadeMessagesByTableName('message_channel_subscribers', 'message_channel_id', 'user_id', res_channel_ids.channel_ids_S, user_id).then(() => {
                            this.deleteCascadeMessagesByTableName('message_channels', 'message_channel_id', 'created_by_id', res_channel_ids.channel_ids_S, user_id).then(() => {
                                this.deleteCascadeMessagesByTableName('message_readers', 'message_id', 'user_id', res_message_ids, user_id).then(() => {
                                    this.deleteMessageAttachments_Efiles(res_message_ids).then(() => {
                                        this.deleteMessages(res_message_ids).then(() => {
                                            if(idx < user_ids.length -1){
                                                idx++;
                                            }else{
                                                return resolve(true)
                                            }
                                        }).catch(err => {
                                            reject(err)
                                        })
                                    }).catch(err => {
                                        reject(err)
                                    })
                                }).catch(err => {
                                    reject(err)
                                })
                            }).catch(err => {
                                reject(err)
                            })
                        }).catch(err => {
                            reject(err)
                        })
                    }).catch(err => {
                        reject(err)
                    })
                }).catch(err => {
                    reject(err)
                })
            })

        })

    }
}

module.exports = messageDao;
