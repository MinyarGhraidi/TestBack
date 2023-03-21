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

    isValidDuration(duration_of_meeting, availability_duration) {
        return duration_of_meeting === availability_duration && duration_of_meeting > 0;
    }

    isTimeInFuture(started_at) {
        let current_time = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
        let difference = moment(started_at, "YYYY-MM-DD HH:mm:ss").diff(moment(current_time, "YYYY-MM-DD HH:mm:ss"), 'minutes');
        return parseInt(difference) > 0
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

    isAvailableTime(meeting_start, meeting_end, first_day, last_day, interval) {
        let format = 'HH:mm:ss';
        let start_work_hour = moment(moment(new Date(first_day))).subtract(1, 'minutes').format("HH:mm:ss");
        let end_work_hour = moment(moment(new Date(last_day))).add(interval + 1, 'minutes').format("HH:mm:ss");
        let first_condition = moment(meeting_start, format).isBetween(moment(start_work_hour, format), moment(end_work_hour, format));
        let second_condition = moment(meeting_end, format).isBetween(moment(start_work_hour, format), moment(end_work_hour, format));
        return first_condition && second_condition
    }

    checkMeetings(meeting_start, meeting_end, start_exist_meeting, end_exist_meeting, interval) {
        let format = 'HH:mm:ss';
        let start_of_existing_meeting = moment(moment(new Date(start_exist_meeting))).subtract(interval, 'minutes').format("HH:mm:ss");
        let end_of_existing_meeting = moment(moment(new Date(end_exist_meeting))).add(interval, 'minutes').format("HH:mm:ss");
        let first_condition = moment(meeting_start, format).isBetween(moment(start_of_existing_meeting, format), moment(end_of_existing_meeting, format));
        let second_condition = moment(meeting_end, format).isBetween(moment(start_of_existing_meeting, format), moment(end_of_existing_meeting, format));
        let third_condition = moment(start_of_existing_meeting, format).isBetween(moment(meeting_start, format), moment(meeting_end, format));
        let forth_condition = moment(end_of_existing_meeting, format).isBetween(moment(meeting_start, format), moment(meeting_end, format));
        return !(first_condition || second_condition || third_condition || forth_condition)
    }

    getAvailability(sales, day, meeting_start, meeting_end, duration) {
        let _this = this;
        return new Promise((resolve, reject) => {
            let sales_man = sales.toJSON();
            let first_day;
            let last_day;
            let days;
            if (sales_man.params.availability !== undefined) {
                first_day = sales_man.params.availability.first_day;
                last_day = sales_man.params.availability.last_day;
                days = sales_man.params.availability.days;
                let sale_id = sales_man.user_id;
                let availability_duration = parseInt(sales_man.params.availability.duration);
                let interval = parseInt(sales_man.params.availability.interval);
                if (this.isTimeInFuture(day)) {
                    if (this.isValidDuration(duration, availability_duration)) {
                        if (this.isAvailableDay(day, first_day[0], last_day[0], days)) {
                            if (this.isAvailableTime(meeting_start, meeting_end, first_day[0], last_day[0], interval)) {
                                _this.isAvailable(sale_id, day, meeting_start, meeting_end, interval)
                                    .then(isAvailableMeeting => {
                                        if (isAvailableMeeting) {
                                            resolve(sales_man);
                                        } else {
                                            resolve(null);
                                        }
                                    })
                                    .catch(err => {
                                        reject(err)
                                    })
                            } else {
                                resolve(null);
                            }
                        } else {
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            }
        });
    }

    getMeetings(sales_id, res) {
        let _this = this;
        this.db["meetings"]
            .findAll({
                where: {
                    active: "Y",
                    sales_id: sales_id
                },
            })
            .then((meetings) => {
                return meetings;
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
            });
    }


    isAvailable(sales_id, day, meeting_start, meeting_end, interval) {
        let _this = this;
        let index = 0;
        return new Promise((resolve, reject) => {
            this.getSalemanMeetings(sales_id, day)
                .then(meetings => {
                    if (meetings && meetings.length !== 0) {
                        meetings.forEach(meeting => {
                            let start_of_existed_meeting = meeting.started_at;
                            let end_of_existed_meeting = meeting.finished_at;
                            let isAvailable = _this.checkMeetings(meeting_start, meeting_end, start_of_existed_meeting, end_of_existed_meeting, interval);
                            if (!isAvailable) {
                                resolve(false)
                            } else if (index < meetings.length - 1) {
                                index++;
                            } else {
                                resolve(true);
                            }
                        })
                    } else {
                        resolve(true)
                    }
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    getSalemanMeetings(sales_id, day) {
        let _day = moment(new Date(day)).format("YYYY-MM-DD");
        return new Promise((resolve, reject) => {
            this.db["meetings"]
                .findAll({
                    where: {
                        active: "Y",
                        sales_id: sales_id,
                        day: _day
                    },
                })
                .then((meetings) => {
                    resolve(meetings)
                })
                .catch((err) => {
                    reject(err);
                });
        })
    }

    getAvailableSales(req, res, next) {
        let _this = this;
        let agent_id = req.body.agent_id;
        let {day, started_at, finished_at} = req.body.date;
        let meeting_start = moment(new Date(started_at)).format("HH:mm:ss");
        let meeting_end = moment(new Date(finished_at)).format("HH:mm:ss");
        let start = moment(new Date(day)).format("YYYY-MM-DD ") + meeting_start
        let duration_moment = moment(finished_at).diff(moment(started_at), 'minutes');
        let duration = parseInt(duration_moment);

        this.db["roles_crms"]
            .findOne({
                where: {
                    active: "Y",
                    value: 'sales',
                },
            })
            .then((sale_role_info) => {
                if (sale_role_info) {
                this.db["users"]
                    .findAll({
                        where: {
                            active: "Y",
                            role_crm_id: sale_role_info.id,
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
                                    _this.getAvailability(sales, start, meeting_start, meeting_end, duration)
                                        .then(availableSale => {
                                            if (availableSale) {
                                                availableSale.meetings = _this.getMeetings(availableSale.user_id, res) || [];
                                                availableSales.push(availableSale);
                                            }
                                            if (index < list_of_sales_men.length - 1) {
                                                index++;
                                            } else {
                                                resolve(availableSales);
                                            }
                                        })
                                        .catch((err) => {
                                            reject(err)
                                        });
                                });
                            }));
                            Promise.all(promise).then((availableSales) => {
                                res.send({
                                    message: "Success",
                                    success: true,
                                    result: availableSales[0],
                                });
                            })
                                .catch((err) => {
                                    return _this.sendResponseError(res, ['Error cannot get availability', err], 1, 403);
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
                        return _this.sendResponseError(res, ['cannot fetch from DB', err], 1, 403);
                    });

                } else {
                    res.send({
                        message: "No role sales found",
                        success: true,
                        result: [],
                    });
                }
            }) .catch((err) => {
            return _this.sendResponseError(res, ['cannot fetch role_sale data from DB', err], 1, 403);
        });
    }

}

module.exports = meetings;
