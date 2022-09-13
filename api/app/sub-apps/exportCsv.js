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
const db = require("../models");
const appHelper = require("../helpers/app");
const rabbitmq_url = appHelper.rabbitmq_url;
const PromiseBB = require("bluebird");
const accBo = new (require('../bo/accbo'))();
const FunctionsManager = require("../services/serviceHelper");
const writeXlsxFile = require("write-excel-file/node");
const path = require("path");
const fctManager = new FunctionsManager();
const appDir = path.dirname(require.main.path);
const moment = require("moment-timezone");


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
                        let queuecsv = rabbitmq_config.queues.exportCsv + item_account.account_id;
                        channel.assertQueue(queuecsv, {
                            durable: true
                        })
                    }).then(data_queues => {
                        const queue = rabbitmq_config.queues.exportCsv;
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
                    whenConnected();
                }
            });
        })
    });
}

    function whenConnected() {
        startSaveDataBuffer();
    }

    function getData(data, callback) {
        // let _this = this
        // const options = {
        //     uri: config.appBaseUrl + "/api/acc/getCdrs/:params?",
        //     method: 'POST',
        //     json: true,
        //     body: data.params
        // };
        // request(options, function (error, response, body) {
        fctManager.getCdrMq(data.params).then(body => {
            if (body && body.success === true) {
                //accBo.DataEmitSocket(body.data, 'export.cdr',data.currentPage, data.pages);
                let dataCallback = {
                    data: body.data,
                    status: true,
                    total: data.pages,
                    currentPage: data.currentPage,
                    sessionId: data.sessionId,
                    role_id: data.params.role_id,
                    resaler_id: data.params.resaler_id,
                    role_value: data.params.role_value
                }
                callback(dataCallback);
            } else {
                let dataCallback = {
                    status: false
                }
                callback(dataCallback);
            }
        })

        // });
    }

    function startSaveDataBuffer() {
        amqpConn.createChannel(function (err, ch) {
            if (closeOnErr(err)) return;

            ch.on("error", function (err) {
                console.error("[AMQP] channel error", err.message);
            });

            ch.on("close", function () {
                console.log("[AMQP] channel closed");
            });

            ch.prefetch(1);

            ch.assertQueue(rabbitmq_config.host, {durable: true, prefetchCount: 500}, function (err, _ok) {
                if (closeOnErr(err)) return;
                db['accounts'].findAll({
                    where: {
                        active: 'Y',
                    }
                })
                    .then(accounts => {
                        if (accounts && accounts.length !== 0) {
                            console.log('rabbitmq_config.queues.exportCsv',rabbitmq_config.queues.exportCsv)
                            PromiseBB.each(accounts, (item_account) => {
                                ch.consume(rabbitmq_config.queues.exportCsv + item_account.account_id, processMsg);
                            }).then(data_queue => {
                                console.log("data clone is started");
                            })
                        }
                    })
            });

            function processMsg(msg) {
                switch (msg.properties.type) {
                    case 'export csv': {
                        const incomingDate = (new Date()).toISOString();
                        const item_data = JSON.parse(msg.content.toString());
                        if (!details_export[item_data.sessionId + item_data.params.time_export]) {
                            details_export[item_data.sessionId + item_data.params.time_export] = {};
                            details_export[item_data.sessionId + item_data.params.time_export].sessionId = item_data.sessionId
                        }
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
                                        column: 'init time',
                                        type: Date,
                                        format: 'YYYY-MM-DD HH:mm:ss',
                                        value: cdr => new Date(moment(cdr.init_time).add(2, 'hours').tz('Europe/Paris').utc().format('YYYY-MM-DD HH:mm:ss'))

                                    },
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
                                        value: cdr => cdr.account ? cdr.account.company_name + "(" + cdr.account.first_name + " " + cdr.account.last_name + ")" : cdr.account_code

                                    },
                                    // {
                                    //     column: 'duration',
                                    //     type: String,
                                    //     value: cdr => cdr.duration.toString()
                                    //
                                    // },
                                    {
                                        column: 'direction',
                                        type: String,
                                        value: cdr => cdr.direction
                                    },
                                    {
                                        column: 'src user',
                                        type: String,
                                        value: cdr => cdr.src_user
                                    }, {
                                        column: 'dst user',
                                        type: String,
                                        value: cdr => cdr.dst_user

                                    }, {
                                        column: 'sip code',
                                        type: String,
                                        value: cdr => cdr.sip_code

                                    }, {
                                        column: 'sip reason',
                                        type: String,
                                        value: cdr => cdr.sip_reason

                                    }, {
                                        column: 'debit',
                                        type: String,
                                        value: cdr => cdr.debit !== null ? cdr.debit.toString() : ''

                                    },
                                ]
                                if (data.role_value === "admin") {
                                    schema.push(
                                        {
                                            column: 'cost',
                                            type: String,
                                            value: cdr => cdr.cost.toString()
                                        },
                                        {
                                            column: 'profit',
                                            type: String,
                                            value: cdr => (Number.parseFloat(cdr.debit) - Number.parseFloat(cdr.cost)).toFixed(6)

                                        },
                                        {
                                            column: 'debit resaler',
                                            type: String,
                                            value: cdr => cdr.debit_rct !== null ?cdr.debit_rct.toString() :0

                                        },
                                        {
                                            column: 'cost resaler',
                                            type: String,
                                            value: cdr => cdr.cost_rct !== null ?cdr.cost_rct.toString():0
                                        },
                                        {
                                            column: 'profit resaler',
                                            type: String,
                                            value: cdr => cdr.debit_rct === null ||cdr.cost_rct === null ? 0:(Number.parseFloat(cdr.debit_rct) - Number.parseFloat(cdr.cost_rct)).toFixed(6)

                                        },

                                    )
                                }
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
                                })
                            }
                        });
                        break;
                    }
                }
            }
        });
    }

    function closeOnErr(err) {
        if (!err) return false;
        console.error("[AMQP] error", err);
        amqpConn.close();
        return true;
    }

start();
