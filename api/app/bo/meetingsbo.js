const {baseModelbo} = require("./basebo");
let sequelize = require("sequelize");
let db = require("../models");
let moment = require("moment");
const tz = require(__dirname + '/../config/config.json')["tz"];


class meetings extends baseModelbo {
    constructor() {
        super("meetings", "meeting_id");
        this.baseModal = "meetings";
        this.primaryKey = "meeting_id";
    }

    isAvailableDay(day, first_day, last_day, availableDays) {
        let f_day = moment(moment(new Date(first_day)).format("YYYY-MM-DD")).subtract(1, 'days');
        let l_day = moment(moment(new Date(last_day)).format("YYYY-MM-DD")).add(1, 'days');
        let meeting_day = moment(new Date(day)).format("YYYY-MM-DD");
        let dayName = moment(new Date(meeting_day)).format("dddd");
        if (moment(meeting_day).isBetween(f_day, l_day)) {
            return availableDays.includes(dayName);
        } else return false;
    }

    isAvailableTime(meeting_start, meeting_end, first_day, last_day,) {
        let format = 'HH:mm:ss'
        let start_work_hour = moment(moment(new Date(first_day))).subtract(1, 'minutes').format("HH:mm:ss");
        let end_work_hour = moment(moment(new Date(last_day))).add(1, 'minutes').format("HH:mm:ss");
        let first_condition = moment(meeting_start, format).isBetween(moment(start_work_hour, format), moment(end_work_hour, format));
        let second_condition = moment(meeting_end, format).isBetween(moment(start_work_hour, format), moment(end_work_hour, format));
        return first_condition && second_condition
    }

    getAvailability(sales, day, meeting_start, meeting_end) {
        return new Promise((resolve, reject) => {
            let sales_man = sales.toJSON();
            let first_day;
            let last_day;
            let days;
            if (sales_man.params.availability !== undefined) {
                first_day = sales_man.params.availability.first_day;
                last_day = sales_man.params.availability.last_day;
                days = sales_man.params.availability.days;
                if (this.isAvailableDay(day, first_day[0], last_day[0], days)) {
                    if (this.isAvailableTime(meeting_start, meeting_end, first_day[0], last_day[0])) {
                        resolve(sales_man);
                    } else {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            }
        });
    }

    getMeetings(sales_id) {
        let _this = this;
        this.db["meetings"]
            .findAll({
                where: {
                    active: "Y",
                    sales_id: sales_id,
                },
            })
            .then((meetings) => {
                return meetings;
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
            });
    }

    authorize(req, res, next) {
        let _this = this;
        let to_number = req.body.to_number;
        let data_resp = {
            "action": "allow",
            "deny_code": "",
            "deny_reason": "",
            "type": "queue",
            "destination": "",
            "caller_id_number": "",
            "pai": "",
            "privacy": 0,
            "max_duration": 0,
            "gateways": []
        }
        this.db["campaigns"]
            .findAll({
                where: {
                    active: "Y",
                },
            })
            .then(campaigns => {
                if (campaigns && campaigns.length !== 0) {
                    let current_camp = campaigns.filter(item => item.params.queue.extension === to_number);
                    if (current_camp && current_camp.length !== 0) {
                        data_resp.destination = current_camp[0].params.queue.extension;
                        res.send(data_resp);
                    } else {
                        data_resp.destination = to_number
                        data_resp.action = "allow";
                        res.send(data_resp);
                    }
                } else {
                    data_resp.destination = to_number
                    data_resp.action = "allow";
                    res.send(data_resp);
                }
            })
            .catch((err) => {
                data_resp.destination = to_number
                data_resp.action = "allow";
                res.send(data_resp);
            });
    }

    getAvailableSales(req, res, next) {
        let _this = this;
        let agent_id = req.body.agent_id;
        let {day, started_at, finished_at} = req.body.date;
        let meeting_start = moment(new Date(started_at)).format("HH:mm:ss");
        let meeting_end = moment(new Date(finished_at)).format("HH:mm:ss");
        this.db["users"]
            .findAll({
                where: {
                    active: "Y",
                    role_crm_id: 5,
                },
            })
            .then((list) => {
                let list_of_sales_men = list.filter(sales => sales.params.agents.includes(agent_id));
                let availableSales = [];
                let promise = [];
                if (list_of_sales_men && list_of_sales_men.length !== 0) {
                    promise.push(new Promise(function (resolve, reject) {
                        let index = 0;
                        list_of_sales_men.forEach(sales => {
                            _this.getAvailability(sales, day, meeting_start, meeting_end).then(availableSale => {
                                if (availableSale) {
                                    availableSale.meetings = _this.getMeetings(availableSale.user_id) || [];
                                    availableSales.push(availableSale);
                                }

                            });
                            if (index < list_of_sales_men.length - 1) {
                                index++;
                            } else {
                                resolve(availableSales);
                            }
                        });
                    }));
                    Promise.all(promise).then((availableSales) => {
                        res.send({
                            message: "Success",
                            success: true,
                            result: availableSales[0],
                        });
                    });
                } else {
                    res.send({
                        message: "No sales found",
                        success: true,
                        result: [],
                    });
                }
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
            });
    }

    // to be cleaned
    saveMeetings(req, res, next) {
        let _this = this;
        let sales_id = req.body.sales_id
        let started_at = req.body.started_at
        this.db["users"]
            .find({
                where: {
                    active: "Y",
                    user_id: sales_id,
                },
            })
            .then(result => {
                res.send(result)
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
            });
    }

}

module.exports = meetings;