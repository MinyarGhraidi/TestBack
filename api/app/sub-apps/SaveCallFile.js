const amqp = require('amqplib/callback_api');
const config = require('../config/config.json');
const rabbitmq_config = (config.rabbitmq) ? config.rabbitmq : {
    "host": "amqp://localhost",
    "queues": {
        "addCallFiles": "oxilog.addCallFiles",
        "clone_List_CallFiles": "oxilog.clone_List_CallFiles"
    }
};
const request = require('request');
let amqpConn = null;
const appHelper = require("../helpers/app");
const rabbitmq_url = appHelper.rabbitmq_url;
const db = require("../models");
const PromiseBB = require("bluebird");
const appSocket = new (require('../providers/AppSocket'))();

console.log('rabbitmq_url', rabbitmq_url)

function start() {
    amqp.connect(rabbitmq_url, function (err, conn) {
        db['accounts'].findAll({
            where: {
                active: 'Y',
            }
        }).then(accounts => {
            if (err) {
                console.error("[AMQP]", err.message);
                return setTimeout(start, 7000);
            }
            conn.on("error", function (err) {
                if (err.message !== "Connection closing") {
                    console.error("[AMQP] conn error", err.message);
                }
            });
            conn.on("close", function () {
                console.error("[AMQP] reconnecting");
                return setTimeout(start, 7000);
            });

            console.log("[AMQP] connected");
            amqpConn = conn;

            conn.createChannel(function (error1, channel) {
                if (error1) {
                    throw error1;
                }
                if (accounts && accounts.length !== 0) {
                    PromiseBB.each(accounts, (item_account) => {
                        let queueCall = rabbitmq_config.queues.addCallFiles + item_account.account_id;
                        let queueCloneCall = rabbitmq_config.queues.clone_List_CallFiles + item_account.account_id;
                        channel.assertQueue(queueCall, {
                            durable: true
                        });
                        channel.assertQueue(queueCloneCall, {
                            durable: true
                        });
                        whenConnected();
                    }).then(queue_data => {
                        const queue = rabbitmq_config.queues.addCallFiles;
                        channel.assertQueue(queue, {
                            durable: true
                        });
                        whenConnected();
                    })
                } else {
                    const queue = rabbitmq_config.queues.addCallFiles;
                    channel.assertQueue(queue, {
                        durable: true
                    });
                    whenConnected();
                }

            });
        })

    });
}

function whenConnected() {
    startReadData();
}

function startReadData() {

    amqpConn.createChannel(function (err, ch) {

        if (closeOnErr(err)) return;

        ch.on("error", function (err) {
            console.error("[AMQP] channel error", err.message);
        });

        ch.on("close", function () {
            console.log("[AMQP] channel closed");
        });

        ch.prefetch(1);
        let index = 0;
        ch.assertQueue(rabbitmq_config.host, {durable: true}, function (err, _ok) {
            if (closeOnErr(err)) return;
            db['accounts'].findAll({
                where: {
                    active: 'Y',
                }
            }).then(accounts => {
                if (accounts && accounts.length !== 0) {
                    PromiseBB.each(accounts, (item_account) => {
                        ch.consume(rabbitmq_config.queues.addCallFiles + item_account.account_id, processMsg,);
                        ch.consume(rabbitmq_config.queues.clone_List_CallFiles + item_account.account_id, processMsg,);
                    }).then(data_queue => {
                        console.log("data clone is started");
                    })
                }
            })
        });

        function processMsg(msg) {
            console.log(msg.properties.type)
            switch (msg.properties.type) {
                case 'save call file': {
                    const incomingDate = (new Date()).toISOString();
                    let data = JSON.parse(msg.content.toString());
                    SaveCallFiles(data).then(result_saveCall => {z
                        console.log("Sending Ack for msg at time " + incomingDate);
                        if (result_saveCall.success) {
                            appSocket.emit('refresh_list_callFiles', {
                                data: data,
                                user_id: data.user_id
                            });
                            ch.ack(msg);
                        } else {
                            ch.reject(msg, true);
                        }
                    });
                    break;
                }
                case 'clone listCallFile': {
                    const incomingDate = (new Date()).toISOString();
                    let data = JSON.parse(msg.content.toString());
                    SaveItemCallFiles(data).then(result_saveCall => {
                        console.log("Sending Ack for msg at time " + incomingDate);
                        if (result_saveCall.success) {
                            appSocket.emit('refresh_clone_list_callFiles', {
                                data: data
                            });
                            ch.ack(msg);
                        } else {
                            ch.reject(msg, true);
                        }

                    });
                }
            }
        }
    });
}

SaveCallFiles = (data) => {
    return new Promise((resolve, reject) => {
        const options = {
            uri: "http://localhost:3001/api/saveCallFile",
            method: 'POST',
            json: true,
            body: data
        };

        request(options, function (error, response, body) {
            if (body && body.success) {
                resolve({
                    success: true,
                })
            } else {
                resolve({
                    success: false
                })
            }
        });
    })
}
SaveItemCallFiles = (data) => {
    return new Promise((resolve, reject) => {
        const options = {
            uri: "http://localhost:3001/api/callfile/save",
            method: 'POST',
            json: true,
            body: data
        };

        request(options, function (error, response, body) {
            if (body) {
                resolve({
                    success: true,
                })
            } else {
                resolve({
                    success: false
                })
            }
        });
    })
}

function closeOnErr(err) {
    if (!err) return false;
    console.error("[AMQP] error", err);
    amqpConn.close();
    return true;
}

start();
