const {baseModelbo} = require('./basebo');
const db = require('../models');
const appSocket = new (require('../providers/AppSocket'))();


class message_channelDao extends baseModelbo {
    constructor() {
        super('message_channels', 'message_channel_id');
        this.baseModal = 'message_channels';
        this.primaryKey = 'message_channel_id';
    }

    get_channel_id_for_subscribers(subscribers) {
        return new Promise((resolve, reject) => {
            let subs_list = subscribers;
            let sql = `SELECT message_channel_id
                       FROM (SELECT mcs.message_channel_id, count(mcs.message_channel_subscriber_id) as total_finded, T1.total_subscribers
                       FROM message_channel_subscribers as mcs
                       INNER JOIN message_channels as mc on mc.message_channel_id = mcs.message_channel_id and mc.active = :active
                       LEFT JOIN (SELECT mcs2.message_channel_id, count(mcs2.message_channel_subscriber_id) as total_subscribers FROM message_channel_subscribers as mcs2 WHERE mcs2.active = :active GROUP BY mcs2.message_channel_id) as T1 on T1.message_channel_id = mcs.message_channel_id
                        WHERE mcs.active = :active AND mcs.user_id IN (:subs_list ) 
                         GROUP BY mcs.message_channel_id, T1.total_subscribers) AS TG
                         WHERE TG.total_subscribers = TG.total_finded AND TG.total_subscribers = :total_requested`;
            db.sequelize['crm-app'].query(sql,
                {
                    type: db.sequelize['crm-app'].QueryTypes.SELECT,
                    replacements: {
                        total_requested: subscribers.length,
                        active: 'Y',
                        subs_list: subs_list
                    }
                })
                .then(data => {
                    resolve({
                        success: true,
                        data: data
                    })
                }).catch(err => {
                reject(err)
            })

        })
    }

    createChannelSubscribers(subscribers, message_channel_id, content) {
        return new Promise((resolve, reject) => {
            subscribers.forEach(subscribe => {
                this.db['message_channel_subscribers'].build({
                    message_channel_id,
                    user_id: subscribe,
                    // created_at: new Date(),
                    //pdated_at: new Date(),
                }).save().then(save_channel_subscriber => {
                    if (save_channel_subscriber) {
                        resolve({
                            data: save_channel_subscriber,
                            success: true,
                        })
                    } else {
                        resolve({
                            message: null,
                            success: false,
                        })
                    }
                })
            })
        })
    }

    createNewChannel(req, res, next) {
        let subscribers = req.body.subscribers;
        let channel_name = req.body.channel_name;
        let is_gp = req.body.is_gp;
        let content = req.body.content;
        if (is_gp) {
            this.db['message_channels'].build({
                created_by_id: subscribers[0],
                channel_type: (subscribers.length === 2) ? 'S' : 'G',
                channel_name: channel_name,
                created_at: new Date(),
                updated_at: new Date(),
            }).save().then(save_channel => {
                if (save_channel) {
                    this.createChannelSubscribers(subscribers, save_channel.message_channel_id, content).then(data => {
                        if (data.success === true) {
                            res.send({
                                data: data.data,
                                success: true
                            })
                        } else {
                            res.send({
                                message: 'create channel subscribers failed',
                                success: false
                            })
                        }
                    }).catch(err => {
                        this.sendResponseError(res, ['Error.CreateChannelSUBSCRIBER'], err)
                    })
                } else {
                    res.send({
                        message: 'create channel failed',
                        success: false
                    })
                }
            })
        } else {
            this.get_channel_id_for_subscribers(subscribers).then(data => {
                if (data.data.length !== 0) {
                    this.db['message_channels'].update({
                        updated_at: new Date()
                    }, {
                        where: {
                            message_channel_id: data.data[0].message_channel_id,
                        }
                    }).then(message_channel => {
                        if (message_channel) {
                            res.send({
                                data: message_channel,
                                success: true,
                            })
                        } else {
                            res.send({
                                message: 'failed to find message channel',
                                success: false,
                            })
                        }
                    }).catch(err => {
                        this.sendResponseError(res, ['Error.UpdateChannel'], err)
                    })

                } else {
                    this.db['message_channels'].build({
                        created_by_id: subscribers[0],
                        channel_type: (subscribers.length === 2) ? 'S' : 'G',
                        channel_name: channel_name,
                        created_at: new Date(),
                        updated_at: new Date(),
                    }).save().then(save_channel => {
                        if (save_channel) {
                            this.createChannelSubscribers(subscribers, save_channel.message_channel_id, content).then(data => {
                                if (data.success === true) {
                                    res.send({
                                        data: data.data,
                                        success: true
                                    })
                                } else {
                                    res.send({
                                        message: 'create channel subscribers failed',
                                        success: false
                                    })
                                }
                            }).catch(err => {
                                this.sendResponseError(res, ['Error.CreateChannelSUBSCRIBER'], err)
                            })
                        } else {
                            res.send({
                                message: 'create channel failed',
                                success: false
                            })
                        }
                    })

                }

            })
        }
    }

    user_has_access_to_channel(message_channel_id, user_id) {
        return new Promise((resolve, reject) => {
            this.db['message_channel_subscribers'].findOne({
                where: {
                    message_channel_id: message_channel_id,
                    user_id: user_id,
                    active: 'Y'
                }
            }).then(user_has_access => {
                if (user_has_access) {
                    resolve({
                        status: true
                    })
                } else {
                    resolve({
                        status: false
                    })
                }
            }).catch(err => {
                reject(err)
            })
        })
    }

    newMessage(message) {
        return new Promise((resolve, reject) => {
            this.db['messages'].build({
                created_by_id: message.created_by_id,
                message_channel_id: message.message_channel_id,
                //attachment_post_id: message.attachment_post_id,
                created_at: new Date(),
                updated_at: new Date(),
                content: message.content
            }).save().then(save_message => {
                if (save_message) {
                    if (message.attachment_post_id) {
                        this.db['message_attachments'].build({
                            attachment_efile_id: message.attachment_post_id,
                            message_id: save_message.message_id,
                            created_at: new Date(),
                            updated_at: new Date(),
                        }).save().then(save_message_attachment => {
                            this.db['messages'].update({
                                attachment_post_id: save_message_attachment.attachment_post_id
                            }, {
                                where: {
                                    message_id: save_message.message_id
                                }
                            }).then(update_message_channel => {
                                this.db['message_channels'].update({
                                    updated_at: save_message.updated_at
                                }, {
                                    where: {
                                        message_channel_id: save_message.message_channel_id
                                    }
                                }).then(update_message_channel => {
                                    if (update_message_channel) {
                                        this.get_message_subscribers(save_message.message_channel_id, message.created_by_id).then(result => {
                                            if (result.data.length !== null) {
                                                result.data.forEach(subscriber => {
                                                    this.db['message_readers'].build({
                                                        message_id: save_message.message_id,
                                                        active: 'Y',
                                                        created_at: save_message.created_at,
                                                        updated_at: save_message.updated_at,
                                                        user_id: subscriber.user_id,
                                                        status_read: (subscriber.user_id === save_message.created_by_id) ? 'Y' : 'N',
                                                    }).save().then(save_message_reader => {
                                                        if (save_message_reader) {
                                                            this.db['messages'].findAll({
                                                                where: {
                                                                    message_channel_id: message.message_channel_id,
                                                                    active: 'Y'
                                                                }
                                                            }).then(all_messages => {
                                                                if (subscriber.user_id !== save_message.created_by_id) {
                                                                    this.update_user_total_messages_not_readed(subscriber.user_id).then(res => {
                                                                        if (res.status === true) {
                                                                            resolve({
                                                                                status: true,
                                                                                data: save_message,
                                                                                all_messages: all_messages
                                                                            })
                                                                        } else {
                                                                            resolve({
                                                                                status: false,
                                                                                data: null
                                                                            })
                                                                        }

                                                                    }).catch(err => {
                                                                        reject(err)
                                                                    })
                                                                }
                                                            }).catch(err => {
                                                                reject(err)
                                                            })

                                                        }
                                                    }).catch(err => {
                                                        reject(err)
                                                    })
                                                })

                                            }

                                        }).catch(err => {
                                            reject(err)
                                        })
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
                    } else {
                        this.db['message_channels'].update({
                            updated_at: save_message.updated_at
                        }, {
                            where: {
                                message_channel_id: save_message.message_channel_id
                            }
                        }).then(update_message_channel => {
                            if (update_message_channel) {
                                this.get_message_subscribers(save_message.message_channel_id, message.created_by_id).then(result => {
                                    if (result.data.length !== null) {
                                        result.data.forEach(subscriber => {
                                            this.db['message_readers'].build({
                                                message_id: save_message.message_id,
                                                active: 'Y',
                                                created_at: save_message.created_at,
                                                updated_at: save_message.updated_at,
                                                user_id: subscriber.user_id,
                                                status_read: (subscriber.user_id === save_message.created_by_id) ? 'Y' : 'N',
                                            }).save().then(save_message_reader => {
                                                if (save_message_reader) {
                                                    this.db['messages'].findAll({
                                                        where: {
                                                            message_channel_id: message.message_channel_id,
                                                            active: 'Y'
                                                        }
                                                    }).then(all_messages => {
                                                        if (subscriber.user_id !== save_message.created_by_id) {
                                                            this.update_user_total_messages_not_readed(subscriber.user_id).then(res => {
                                                                if (res.status === true) {
                                                                    resolve({
                                                                        status: true,
                                                                        data: save_message,
                                                                        all_messages: all_messages
                                                                    })
                                                                } else {
                                                                    resolve({
                                                                        status: false,
                                                                        data: null
                                                                    })
                                                                }

                                                            }).catch(err => {
                                                                reject(err)
                                                            })
                                                        }
                                                    }).catch(err => {
                                                        reject(err)
                                                    })

                                                }
                                            }).catch(err => {
                                                reject(err)
                                            })
                                        })

                                    }

                                }).catch(err => {
                                    reject(err)
                                })
                            }

                        }).catch(err => {
                            reject(err)
                        })
                    }

                } else {
                    resolve({
                        status: false,
                        message: "failed to create message"
                    })

                }

            }).catch(err => {
                reject(err)
            })
        })
    }

    update_user_total_messages_not_readed(user_id) {
        return new Promise((resolve, reject) => {
            let sql = `
            SELECT count(mr.message_reader_id) as count
            FROM message_readers as mr
            INNER JOIN messages as m on m.message_id = mr.message_id AND m.active = :active
            INNER JOIN message_channels as mc on mc.message_channel_id = m.message_channel_id AND mc.active = :active
            WHERE mr.active = :active
                AND mr.status_read <> 'Y'
                AND mr.user_id = :user_id
            `;
            db.sequelize['crm-app'].query(sql,
                {
                    type: db.sequelize['crm-app'].QueryTypes.SELECT,
                    replacements: {
                        user_id: user_id,
                        active: 'Y',
                    }
                }).then(count_total => {
                if (count_total[0] !== null) {
                    this.db['user_data_indexs'].findOne({
                        where: {
                            user_id: user_id
                        }
                    }).then(user_data_index => {
                        if (user_data_index) {
                            this.db['user_data_indexs'].update({
                                total_message_not_readed: count_total[0].count,
                                updated_at: new Date(),
                            }, {
                                where: {
                                    user_id: user_id
                                }
                            }).then(update_user_data => {
                                if (update_user_data) {
                                    resolve({
                                        status: true,
                                        message: 'update user data index'
                                    })
                                }
                            }).catch(err => {
                                reject(err)
                            })
                        } else {
                            this.db['user_data_indexs'].build({
                                user_id: user_id,
                                total_message_not_readed: count_total[0].count,
                                created_at: new Date(),
                                updated_at: new Date(),
                                active: 'Y'

                            }).save().then(save_user_data_index => {
                                if (save_user_data_index) {
                                    resolve({
                                        status: true,
                                        message: 'save user data index'
                                    })
                                }
                            }).catch(err => {
                                reject(err)
                            })
                        }
                    }).catch(err => {
                        reject(err)
                    })
                }
            }).catch(err => {
                reject(err)
            })
        })

    }

    sendNewMessage(req, res, next) {
        let content = req.body.content;
        let message_channel_id = req.body.message_channel_id;
        let attachment_post_id = req.body.attachment_post_id;
        let created_by_id = req.body.created_by_id;
        let user_id = req.body.user_id;
        if ((!!!content || content === '') && !!!attachment_post_id) {
            res.send({
                success: false,
                data: null,
                messages: [{
                    userMessage: 'content is not provided',
                    internalMessage: 'content is not provided',
                }]
            });
            return;
        }

        this.user_has_access_to_channel(message_channel_id, user_id).then(result => {
            if (result.status === true) {
                this.newMessage(req.body).then(new_message => {
                    if (new_message.status === true) {
                        res.send({
                            success: true,
                            data: new_message.all_messages
                        })
                    }
                })
            } else {
                res.send({
                    data: null,
                    message: ' you cant access to this channel'
                })
            }
        })
    }

    set_message_channel_as_read(message_channel_id, user_id) {
        return new Promise((resolve, reject) => {
            let sql = `UPDATE message_readers
                         SET status_read = 'Y'
                          FROM message_readers mr
                          INNER JOIN messages as m on m.message_id = mr.message_id AND m.active = 'Y'
                           WHERE mr.user_id = :user_id AND m.message_channel_id = :message_channel_id AND mr.status_read <> 'Y'`;

            db.sequelize['crm-app'].query(sql,
                {
                    type: db.sequelize['crm-app'].QueryTypes.SELECT,
                    replacements: {
                        message_channel_id: message_channel_id,
                        user_id: user_id,
                        active: 'Y',
                        status_read_new: 'Y',
                        status_read_old: 'Y'
                    }
                })
                .then(result => {
                    resolve({
                        status: true,
                        data: result
                    })
                }).catch(err => {
                reject(err)
            })
        })

    }

    getChannelMessages(req, res, next) {
        let {message_channel_id, user_id} = req.body;
        this.user_has_access_to_channel(message_channel_id, user_id).then(result => {
            if (result.status === true) {
                let sql = `SELECT m.*,ma.attachment_efile_id,ef.file_type ,mc.channel_type,
                    u.first_name as user_firstname, u.username as user_lastname, u.profile_image_id as profile_picture_efile_id, mr.status_read
                                FROM messages as m
                    
                                LEFT JOIN users as u on u.user_id = m.created_by_id and u.active = :active
                   
                                LEFT JOIN message_readers as mr on mr.message_id = m.message_id and mr.active = :active and mr.user_id = :user_id
                                LEFT JOIN message_channels as mc on mc.message_channel_id = m.message_channel_id and mc.active = :active
                                LEFT JOIN message_attachments as ma on ma.attachment_post_id = m.attachment_post_id and ma.active = :active
                                LEFT JOIN efiles as ef on ef.file_id = ma.attachment_efile_id and ef.active = :active
                    
                                WHERE m.active = :active AND m.message_channel_id = :message_channel_id
                                        
                                GROUP BY m.message_id,u.first_name,u.username,u.profile_image_id,mr.status_read, ma.attachment_efile_id, ef.file_type, mc.channel_type
                    
                                ORDER BY m.updated_at ASC`;
                db.sequelize['crm-app'].query(sql,
                    {
                        type: db.sequelize['crm-app'].QueryTypes.SELECT,
                        replacements: {
                            message_channel_id: message_channel_id,
                            user_id: user_id,
                            active: 'Y',
                        }
                    })
                    .then(messages => {
                        let sql_count = `
                        SELECT count(*) as totalItems FROM (
                            SELECT m.message_id

                        FROM messages as m

                        LEFT JOIN users as u on u.user_id = m.created_by_id and u.active = :active

                        LEFT JOIN message_readers as mr on mr.message_id = m.message_id and mr.active = :active and mr.user_id = :user_id

                        WHERE m.message_channel_id = :message_channel_id AND m.active = :active

                        GROUP BY m.message_id ) as T`;
                        db.sequelize['crm-app'].query(sql_count,
                            {
                                type: db.sequelize['crm-app'].QueryTypes.SELECT,
                                replacements: {
                                    message_channel_id: message_channel_id,
                                    user_id: user_id,
                                    active: 'Y',
                                }
                            })
                            .then(count_total => {
                                let has_no_readed_msgs = false;
                                this.AllMessage(messages, has_no_readed_msgs, message_channel_id, user_id, count_total).then(all_message => {
                                    if (all_message.success === true) {
                                        res.send({
                                            data: messages,
                                            success: true,
                                            total: count_total[0].totalItems
                                        })
                                    }
                                })


                            })

                    })

            } else {
                res.send({
                    data: null,
                    message: ' you cant access to this channel'
                })
            }
        })

    }

    AllMessage(messages, has_no_readed_msgs, message_channel_id, user_id, count_total) {
        return new Promise((resolve, reject) => {
            messages.forEach(msg => {
                if (msg.status_read !== null && msg.status_read !== 'Y') {
                    has_no_readed_msgs = true;
                }
            })
            if (has_no_readed_msgs) {
                this.set_message_channel_as_read(message_channel_id, user_id).then(update_message_channel => {
                    if (update_message_channel.status === true) {
                        this.update_user_total_messages_not_readed(user_id).then(update_user_msg => {
                            if (update_user_msg.status === true) {
                                resolve({
                                    data: messages,
                                    success: true,
                                    total: count_total[0].totalItems
                                })
                            }
                        })
                    }

                })

            } else {
                resolve({
                    data: messages,
                    success: true,
                    total: count_total[0].totalItems
                })
            }
        })
    }

    get_message_subscribers(message_channel_id, current_user_id) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT mcs.status_read, u.user_id as user_id, u.first_name,u.last_name , u.username, u.profile_image_id FROM message_channel_subscribers as mcs
                   INNER JOIN users as u on u.user_id = mcs.user_id and u.active = :active
                   WHERE mcs.active = :active AND mcs.message_channel_id = :message_channel_id 
                   and mcs.user_id != :current_user_id
                   ORDER BY mcs.created_at ASC
                   LIMIT 50`;
            db.sequelize['crm-app'].query(sql,
                {
                    type: db.sequelize['crm-app'].QueryTypes.SELECT,
                    replacements: {
                        message_channel_id: message_channel_id,
                        active: 'Y',
                        current_user_id: current_user_id
                    }
                })
                .then(subscribers => {
                    if (subscribers) {
                        resolve({
                            data: subscribers,
                            status: true
                        })
                    } else {
                        resolve({
                            data: null,
                            status: false
                        })
                    }

                }).catch(err => {
                reject(err)
            })

        })
    }

    channel_name(subscribers, channel, user_id) {
        return new Promise((resolve, reject) => {
            let new_channel_name = '';
            let i = 0;
            subscribers.data.forEach(subscriber => {
                if (channel.channel_type === 'G') {
                    new_channel_name = subscriber.user_familyname + ' ' + subscriber.user_name;
                } else if (subscriber.user_id !== user_id) {
                    // channel.channel_picture_efile_id = subscriber.profile_image_id;
                    new_channel_name = subscriber.first_name + ' ' + subscriber.last_name;
                }
            })
            new_channel_name = new_channel_name.trim();
            if (channel.channel_name === null) {
                channel.channel_name = new_channel_name
            }
            resolve({
                data: channel.channel_name
            })
        })
    }

    updateChannel(channels, user_id) {
        return new Promise((resolve, reject) => {
            let idx = 0;
            channels.map(channel => {
                this.get_message_subscribers(channel.message_channel_id, user_id).then(subscribers => {
                    if (subscribers.status === true) {
                        this.channel_name(subscribers, channel, user_id).then(name => {
                            channel.channel_name = name.data;
                            channel.subscribes = subscribers.data || [];
                            if (idx === channels.length - 1) {
                                resolve({
                                    data: channels
                                })
                            } else {
                                idx++;
                            }
                        }).catch(err => {
                            reject(err);
                        })
                    }
                }).catch(err => {
                    reject(err);
                })
            })
        })
    }

    getMyChannel(req, res, next) {
        let user_id = req.body.user_id;
        let channel_name = req.body.channel_key
        const defaultParams = {
            limit: 20,
            filter: [],
            offset: 0,
            sortBy: this.primaryKey,
            sortDir: 'ASC'
        };

        let sql = `SELECT mc.*, u__subs.profile_image_id as profile_image_id, count(m.message_id) as total_messages, count(mr_count.message_id) as total_not_read, m_last.message_id as last_message_id, m_last.content as last_message_content
                  , m_last.created_by_id as m_last_created_by_id ,  m_last.created_at as last_message_date    FROM message_channels as mc
                      LEFT JOIN message_channel_subscribers as mcs on mcs.active = :active and mcs.message_channel_id = mc.message_channel_id
                      LEFT JOIN message_channel_subscribers as mcs2 on mcs2.active = :active and mcs2.message_channel_id = mc.message_channel_id and mcs.user_id <> mcs2.user_id
                      LEFT JOIN messages as m on m.message_channel_id = mc.message_channel_id and m.active = :active
                      LEFT JOIN messages as m_last on m_last.message_channel_id = mc.message_channel_id and m_last.active = :active and m_last.message_id = (SELECT m_last_one.message_id FROM messages as m_last_one WHERE m_last_one.message_channel_id = mc.message_channel_id AND m_last_one.active = :active ORDER BY "m_last_one"."created_at" DESC LIMIT 1)
                      LEFT JOIN users as u on u.user_id = m_last.created_by_id AND u.active = :active
                      LEFT JOIN users as u__subs on u__subs.user_id = mcs2.user_id AND u__subs.active = :active
                      LEFT JOIN message_readers as mr_count on mr_count.message_id = m_last.message_id and mr_count.active = :active AND mr_count.status_read <> :active AND mr_count.user_id = mcs.user_id
                      WHERE 1 = 1
                          AND mc.active = :active
                          AND mcs.user_id = :user_id
                        EXTRAWHERE
                     GROUP BY mc.message_channel_id, mc.last_excerpt, u__subs.profile_image_id, m_last.message_id , m_last.created_by_id
                    ORDER BY mc.updated_at DESC
                    OFFSET :offset LIMIT :limit`;
        let extra_where = "";
        if (channel_name) {
            extra_where = extra_where + " AND mc.channel_name like :channel_name";
        }
        sql = sql.replace(/EXTRAWHERE/g, extra_where);

        db.sequelize['crm-app'].query(sql,
            {
                type: db.sequelize['crm-app'].QueryTypes.SELECT,
                replacements: {
                    user_id: user_id,
                    offset: defaultParams.offset,
                    limit: defaultParams.limit,
                    active: 'Y',
                    channel_name: channel_name ? channel_name.concat('%') : null
                }
            })
            .then(channels => {
                if (channels && channels.length !== 0) {
                    this.updateChannel(channels, user_id).then(result => {
                        if (result) {
                            res.send({
                                success: true,
                                status: 200,
                                data: result.data
                            })
                        } else {
                            res.send({
                                success: true,
                                status: 200,
                                data: []
                            })
                        }

                    }).catch(err => {
                        console.log(err)
                        this.sendResponseError(res, ['Error.getDataChannel'], err);
                    })
                } else {
                    res.send({
                        data: []
                    })
                }
            }).catch(err => {
            console.log(err)
            this.sendResponseError(res, ['Error.getDataChannel'], err);
        })
    }

    updateMessageChannelSubscribes(req, res, next) {
        let {message_channel_id, userDeleted} = req.body;
        this.db['message_channel_subscribers'].update({
                active: 'N',
            },
            {
                where: {
                    message_channel_id: message_channel_id,
                    user_id: {
                        $in: userDeleted
                    }
                },
            }
        ).then(manageChatUsers => {
            this.db['message_channel_subscribers'].findAll({
                where: {
                    message_channel_id: message_channel_id,
                    active: 'Y'
                }
            }).then(data_message_channel => {
                if (data_message_channel && data_message_channel.length > 1) {
                    res.send({
                        success: true,
                        data: []
                    })
                } else {
                    this.db['message_channels'].update({
                            active: 'N',
                        },
                        {
                            where: {
                                message_channel_id: message_channel_id,
                            },
                        }
                    ).then(manageChatUsers => {
                        res.send({
                            success: true,
                            data: []
                        })
                    }).catch(err => {
                        this.sendResponseError(res, ['error.update.message'], err);
                    })
                }

            }).catch(err => {
                this.sendResponseError(res, ['error.update.message'], err);
            })
        }).catch(err => {
            this.sendResponseError(res, ['error.update.message'], err);
        })
    }

    addSubscribersToChannel(req, res, next) {
        let _this = this;
        let {message_channel_id, contacts} = req.body
        if (!message_channel_id || !contacts && contacts.length === 0) {
            _this.sendResponseError(res, ['Error data please try again'])
        }
        _this.createChannelSubscribers(contacts, message_channel_id).then(data => {
            res.send({
                success: true,
                status: 200
            })
        }).catch(err => {
            _this.sendResponseError(res, ['An Error has occurred please try again'])
        })
    }
}

module.exports = message_channelDao;
