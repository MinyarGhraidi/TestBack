const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');

class livecalls extends baseModelbo {
    constructor() {
        super('live_calls', 'id');
        this.baseModal = "live_calls";
        this.primaryKey = 'id';
    }

    getLiveCallsByCallId(req, res, next) {
        let _this = this;
        let {call_id} = req.body;
        this.db['live_calls'].findAll({where: {callid: call_id, active: 'Y'}})
            .then(livecalls => {
                res.send({
                    status: 200,
                    message: "success",
                    data: livecalls
                });
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Cannot fetch data from DB', err], 1, 403);
            })
    }

    getEvents(req, res, next) {
        let _this = this;
        this.db['live_calls'].findAll({where: {active: 'Y'}})
            .then(livecalls => {
                this.handleEvents(livecalls)
                    .then(listEvents => {
                        let events = [].concat.apply([], listEvents);
                        let sortedEvents = events.sort((a,b) => parseInt(b.startTime) - parseInt(a.startTime))
                        res.send({
                            status: 200,
                            message: "success",
                            data: sortedEvents
                        });
                    })
                    .catch(err => {
                        return _this.sendResponseError(res, ['Cannot create events list', err], 1, 403);
                    })
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Cannot fetch data from DB', err], 1, 403);
            })
    }

    handleEvents(livecalls) {
        let events = [];
        let index = 0;
        return new Promise((resolve, reject) => {
            if (livecalls && livecalls.length !== 0) {
                livecalls.forEach(el => {
                    this.handleOneCallEvents(el)
                        .then(oneCallEvents => {
                            events.push(oneCallEvents);
                            if (index < livecalls.length - 1) {
                                index++;
                            } else {
                                let eventsMerged = [].concat.apply([], events);
                                resolve(eventsMerged);
                            }
                        })
                        .catch(err => {
                            reject(err);
                        })
                })
            } else {
                resolve(events);
            }
        })
    }

    handleOneCallEvents(callEvents) {
        let events = [];
        let index = 0;
        return new Promise((resolve, reject) => {
            if (callEvents.events && callEvents.events.length !== 0) {
                callEvents.events.forEach(el => {
                    let agent_id = callEvents.agent_id;
                    let callid = callEvents.callid;
                    let event = JSON.parse(JSON.stringify(el));
                    event.agent_id = agent_id;
                    event.callid = callid;
                    events = [...events, event];
                    if (index < callEvents.events.length - 1) {
                        index++;
                    } else {
                        let eventsMerged = [].concat.apply([], events);
                        resolve(eventsMerged);
                    }
                })
            } else {
                resolve(events);
            }
        })
    }

}

module.exports = livecalls;