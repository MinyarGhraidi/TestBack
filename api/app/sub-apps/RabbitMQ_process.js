const amqp = require('amqplib/callback_api');
const config = require('../config/config.json');
const rabbitmq_config = (config.rabbitmq) ? config.rabbitmq : {
    "host": "amqp://localhost",
    "queues": {
        "addCallFiles": "oxilog.addCallFiles",
        "clone_List_CallFiles": "oxilog.clone_List_CallFiles",
        "exportCsv": "oxilog.exportCsv"
    }
};
const request = require('request');
let amqpConn = null;
const appHelper = require("../helpers/app");
const rabbitmq_url = appHelper.rabbitmq_url;
const db = require("../models");
const AccBo = require("../bo/accbo");
const PromiseBB = require("bluebird");
const appSocket = new (require('../providers/AppSocket'))();
const writeXlsxFile = require("write-excel-file/node");
const path = require("path");
const accBo = new (require('../bo/accbo'))();
const _accbo = new AccBo();
const appDir = path.dirname(require.main.path);
const moment = require("moment-timezone");
console.log('rabbitmq_url', rabbitmq_url)


let FullDataToCsv = {};
let details_export = {};
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
                        let queueCall = rabbitmq_config.queues.addCallFiles + item_account.user_id;
                        let queueCloneCall = rabbitmq_config.queues.clone_List_CallFiles + item_account.user_id;
                        let queuecsv = rabbitmq_config.queues.exportCsv + item_account.user_id;
                        channel.assertQueue(queueCall, {
                            durable: true
                        });
                        channel.assertQueue(queueCloneCall, {
                            durable: true
                        });
                        channel.assertQueue(queuecsv, {
                            durable: true
                        })
                        whenConnected();
                    }).then(queue_data => {
                        const queuecsv = rabbitmq_config.queues.exportCsv;
                        channel.assertQueue(queuecsv, {
                            durable: true
                        });
                        const queue = rabbitmq_config.queues.addCallFiles;
                        channel.assertQueue(queue, {
                            durable: true
                        });
                        whenConnected();
                    })
                } else {
                    const queuecsv = rabbitmq_config.queues.exportCsv;
                    channel.assertQueue(queuecsv, {
                        durable: true
                    })
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
                        ch.consume(rabbitmq_config.queues.addCallFiles + item_account.user_id, processMsg,);
                        ch.consume(rabbitmq_config.queues.clone_List_CallFiles + item_account.user_id, processMsg,);
                        ch.consume(rabbitmq_config.queues.exportCsv + item_account.user_id, processMsg);
                    }).then(data_queue => {
                        console.log("data clone is started");
                        console.log("add CallFile");
                        console.log("export CSV");
                    })
                }
            })
        });

        function processMsg(msg) {
            switch (msg.properties.type) {
                case 'save call file': {
                    const incomingDate = (new Date()).toISOString();
                    let data = JSON.parse(msg.content.toString());
                    SaveCallFiles(data).then(result_saveCall => {
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
                    break;
                }
                case 'export csv': {
                    const incomingDate = (new Date()).toISOString();
                    const item_data = JSON.parse(msg.content.toString());
                    if (!details_export[item_data.sessionId + item_data.params.time_export]) {
                        details_export[item_data.sessionId + item_data.params.time_export] = {};
                        details_export[item_data.sessionId + item_data.params.time_export].sessionId = item_data.sessionId
                    }
                    console.log("session_id To export CSV --->",item_data.sessionId)
                    if ((details_export[item_data.sessionId + item_data.params.time_export].time_export !== item_data.params.time_export) && (details_export[item_data.sessionId + item_data.params.time_export].sessionId === item_data.sessionId)) {
                        details_export[item_data.sessionId + item_data.params.time_export].time_export = item_data.params.time_export;
                        details_export[item_data.sessionId + item_data.params.time_export].sessionId = item_data.sessionId;
                        FullDataToCsv[item_data.sessionId + item_data.params.time_export] = []
                    }
                    getData(item_data, function (data) {
                        FullDataToCsv[item_data.sessionId + item_data.params.time_export] = FullDataToCsv[item_data.sessionId + item_data.params.time_export].concat(data.data);
                        if (data.total !== data.currentPage) {
                            accBo.DataEmitSocket({}, 'export.cdr', data.currentPage, data.total, data.sessionId, item_data.params.total, FullDataToCsv[item_data.sessionId + item_data.params.time_export].length);
                            console.log("Sending Ack for msg at time " + incomingDate);
                            try {
                                if (data.status) {
                                    ch.ack(msg);

                                } else {
                                    ch.reject(msg, true);
                                }

                            } catch (e) {
                                closeOnErr(e);
                            }
                        } else
                        if (data.total === data.currentPage) {
                            let schema = [
                                {
                                    column: 'start time',
                                    type: Date,
                                    format: 'YYYY-MM-DD HH:mm:ss',
                                    value: cdr => new Date(moment(cdr.start_time).add(2, 'hours').tz('Europe/Paris').utc().format('YYYY-MM-DD HH:mm:ss'))
                                },
                                {
                                    column: 'end time',
                                    type: Date,
                                    format: 'YYYY-MM-DD HH:mm:ss',
                                    value: cdr => new Date(moment(cdr.end_time).add(2, 'hours').tz('Europe/Paris').utc().format('YYYY-MM-DD HH:mm:ss'))
                                },
                                {
                                    column: 'account',
                                    type: String,
                                    value: cdr => cdr.account ? cdr.account.company + "(" + cdr.account.first_name + " " + cdr.account.last_name + ")" : cdr.accountcode

                                },
                                {
                                    column: 'duration',
                                    type: String,
                                    value: cdr => Math.ceil(Number(cdr.durationsec) + Number(cdr.durationmsec / 1000)).toString()

                                },
                                {
                                    column: 'direction',
                                    type: String,
                                    value: cdr => cdr.calldirection
                                },
                                {
                                    column: 'src user',
                                    type: String,
                                    value: cdr => cdr.call_events ? cdr.call_events[0].callerNumber : ''
                                }, {
                                    column: 'dst user',
                                    type: String,
                                    value: cdr => cdr.call_events ? cdr.call_events[0].destination : ''

                                }, {
                                    column: 'sip code',
                                    type: String,
                                    value: cdr => cdr.sip_code !== null ? cdr.sip_code : ''

                                }, {
                                    column: 'sip reason',
                                    type: String,
                                    value: cdr => cdr.sip_reason !== null ? cdr.sip_reason : ''

                                }, {
                                    column: 'debit',
                                    type: String,
                                    value: cdr => cdr.debit !== null ? cdr.debit.toString() : ''

                                },
                                {
                                    column: 'context',
                                    type: String,
                                    value: cdr => cdr.context !== null ? cdr.context.toString() : ''

                                },
                                {
                                    column: 'call ID',
                                    type: String,
                                    value: cdr => cdr.callid !== null ? cdr.callid.toString() : ''

                                },
                                {
                                    column: 'Call Status',
                                    type: String,
                                    value: cdr => cdr.callstatus !== null ? cdr.callstatus.toString() : ''

                                },
                                {
                                    column: 'SIP From URI CallCenter',
                                    type: String,
                                    value: cdr => cdr.sipfromuri_callcenter !== null ? cdr.sipfromuri_callcenter.toString() : ''

                                },
                                {
                                    column: 'Answer Time',
                                    type: String,
                                    value: cdr => cdr.answertime !== null ? cdr.answertime.toString() : ''

                                },
                                {
                                    column: 'Agent',
                                    type: String,
                                    value: cdr => cdr.agent !== null ? cdr.agent.toString() : ''

                                },
                                {
                                    column: 'Campaign ID',
                                    type: String,
                                    value: cdr => cdr.campaign_name !== null ? cdr.campaign_name.toString() : ''

                                }
                            ]
                            const file_name = Date.now() + '-cdr.xlsx';
                            const file_path = appDir + '/resources/cdrs/' + file_name;
                            writeXlsxFile(FullDataToCsv[item_data.sessionId + item_data.params.time_export], {
                                schema,
                                filePath: file_path
                            }).then(data_file => {
                                accBo.DataEmitSocket({file_name: file_name}, 'export.cdr', data.currentPage, data.total, data.sessionId, item_data.params.total, FullDataToCsv[item_data.sessionId + item_data.params.time_export].length);
                                console.log("Sending Ack for msg at time " + incomingDate);
                                try {
                                    if (data.status) {
                                        ch.ack(msg);
                                    } else {
                                        ch.reject(msg, true);
                                    }

                                } catch (e) {
                                    closeOnErr(e);
                                }
                                return true
                            }).catch(err=>{
                                console.log(err)
                            })
                        }
                    });
                    break;
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

//---------> Export CSV <-------------//
function getData(data, callback) {
    _accbo._getCdrsFunction(data.params).then(body => {
        if (body && body.success === true) {
            let dataCallback = {
                data: body.data,
                status: true,
                total: data.pages,
                currentPage: data.currentPage,
                sessionId: data.sessionId
            }
            callback(dataCallback);
        } else {
            let dataCallback = {
                status: false
            }
            callback(dataCallback);
        }
    }).catch(err=>{
    })
}
function closeOnErr(err) {
    if (!err) return false;
    console.error("[AMQP] error", err);
    amqpConn.close();
    return true;
}

start();