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
        let meeting_day = day.day ? day.day : day;
        let dayName = moment(meeting_day).format("dddd");
        if (moment(meeting_day).isBetween(first_day, last_day)) {
            return availableDays.includes(dayName);
        } else return false;
    }

    isAvailableTime(day, first_day, last_day, availableDays) {
        let meeting_day = day.day ? day.day : day;
        let started_meeting_time = moment(meeting_day).format("HH:mm");
        if (moment(meeting_day).isBetween(first_day, last_day)) {
            return availableDays.includes(dayName);
        } else return false;
    }

    getAvailability(sales, day) {
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
                    resolve(sales_man);
                } else {
                    resolve(null);
                }
            }
        });
    }

    getMeetings(sales_id) {
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
                let res = [];
                let messages = "Cannot fetch data from database Meetings";
                this.sendResponseError(res, messages, err, (status = 500));
            });
    }

    getAvailableSales(req, res, next) {
        let _this = this;
        let {day, agent_id} = req.body.date;
        this.db["users"]
            .findAll({
                where: {
                    active: "Y",
                    role_crm_id: 5,
                },
            })
            .then((list) => {
                let list_of_sales_men = list.filter(sales => sales.params.agents.includes(agent_id))
                let availableSales = [];
                let promise = [];
                if (list_of_sales_men && list_of_sales_men.length !== 0) {
                    promise.push(new Promise(function (resolve, reject) {
                        let index = 0;
                        list_of_sales_men.forEach(sales => {
                            _this.getAvailability(sales, day).then(availableSale => {
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
                let res = [];
                let messages = "Cannot fetch data from database";
                this.sendResponseError(res, messages, err, (status = 500));
            });
    }

    saveMeetings(req, res, next) {
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
                let updated_event = result;
                let duration = result.params.availability.duration;
                let interval = result.params.availability.interval;
                let totalTime = +duration + +interval;
                let finished_at = moment.tz(started_at, tz).add(totalTime, 'minutes')

                updated_event.finished_at = finished_at
                this.save(updated_event)

                return (res.send({
                    message: "Success",
                    success: true,
                    result: {
                        started_at: started_at,
                        finished_at: finished_at,
                        totalTime: totalTime
                    },
                }))
            })
    }

}

module.exports = meetings;