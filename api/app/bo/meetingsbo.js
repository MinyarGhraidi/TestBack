const { baseModelbo } = require("./basebo");
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

  isAvailableDay(day, first_day, last_day, availableDays, duration, interval) {
    let dayName = moment(day).format("dddd");
    let meeting_started_at = moment(day).format('HH:mm:ss');
    let meeting_finished_at = moment(day).tz(tz).add((+duration + +interval), 'minutes').format('HH:mm:ss');
    let startWorkHour = moment(first_day[0]).format('HH:mm:ss');
    let workOff_hour = moment(last_day[0]).format('HH:mm:ss');
console.log(moment(meeting_started_at, 'HH:mm:ss').isBetween(moment(startWorkHour, 'HH:mm:ss'), moment(workOff_hour, 'HH:mm:ss')))
    if (moment(day).isBetween(first_day, last_day[0])) {
      if(availableDays.includes(dayName)) {
          return (moment(meeting_started_at, 'HH:mm:ss').isBetween(moment(startWorkHour, 'HH:mm:ss'), moment(workOff_hour, 'HH:mm:ss')) 
          && moment(meeting_finished_at,'HH:mm:ss').isBetween(moment(startWorkHour,'HH:mm:ss'), moment(workOff_hour,'HH:mm:ss')))
      }
    } else return false;
  }


  isAvailableHour(day, duration, interval, meetings) {
    let started_at = moment(day).format('HH:mm:ss');
    let totalTime = +duration + +interval;
    let finished_at = moment(started_at).tz(tz).add(totalTime, 'minutes').format('HH:mm:ss');
    let index=0;
    return new Promise((resolve, reject) => {
       if(meetings.length === 0) resolve(true);
       else {
           meetings.forEach((meeting)=> {
               let meeting_start = meeting?.started_at;
               let meeting_end = meeting?.finished_at;
               let before = moment(meeting_start).format('HH:mm:ss');
               let after = moment(meeting_end).format('HH:mm:ss');
   
   
               if (moment(started_at, 'HH:mm:ss').isBetween(moment(before, 'HH:mm:ss'), moment(after, 'HH:mm:ss')) 
               || moment(finished_at, 'HH:mm:ss').isBetween(moment(before, 'HH:mm:ss'), moment(after, 'HH:mm:ss'))) {
                   resolve(false)
               } else {
                   if(index<meetings.length-1){
                       index++
                   }
                   else resolve(true)
               }
           })
       }
    })
    
  }

  getData(sales, day, duration, interval) {
    return new Promise((resolve, reject) => {
      let sales_json = sales.toJSON();
      let first_day = sales_json?.params?.availability?.first_day;
      let last_day = sales_json?.params?.availability?.last_day;
      if (
        this.isAvailableDay(
          day,
          first_day,
          last_day,
          sales_json?.params?.availability?.days,
          duration,
          interval
        )
      )
        resolve(sales_json);
      else resolve(null);
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
    
    let day  = Object.keys(req.body)[0];

    let availableSales = [];
    let test = 0;

    const { Op } = db.sequelize;
    this.db["users"]
      .findAll({
        where: {
          active: "Y",
          user_type: "sales",
        },
      })
      .then((result) => {
        let _this = this;
        let indexCallFile = 0;
        if (result) {
          let promise = new Promise(function (resolve, reject) {
              result.forEach((sale) => {
                let duration = sale?.params?.availability?.duration
                let interval = sale?.params?.availability?.interval
              _this.getData(sale, day, duration, interval).then((availableSale) => {

                if (availableSale) { 
                  let meetings = _this.getMeetings(availableSale.user_id) || [];
                 _this.isAvailableHour(day, duration, interval, meetings).then(data_meetings => {
                    if(data_meetings){
                        availableSale.meetings = meetings;
                         availableSales.push(availableSale)                         ;
                         test++;
                        }

                    })
                }
                if (indexCallFile < result.length - 1 ) {
                    indexCallFile++;
                } else {
                    resolve(availableSales);
                }
              });
            });
          });
          Promise.all([promise]).then((availableSales) => {

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
        .then(result =>             
            {   
                let updated_event = result;
                let duration = result.params.availability.duration ;
                let interval = result.params.availability.interval;
                let totalTime = +duration + +interval;
                let finished_at = moment.tz(started_at, tz).add(totalTime, 'minutes')

                updated_event.finished_at = finished_at
                this.save(updated_event)

            return (res.send({
            message: "Success",
            success: true,
            result: {
                started_at:started_at,
                finished_at : finished_at,
                totalTime : totalTime
            },
          }))
        })
    }



}

module.exports = meetings;
