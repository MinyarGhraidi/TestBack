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

  isAvailableDay(day, first_day, last_day, availableDays, finished_at) {
    let dayName = moment(day).format("dddd");
    let meeting_started_at = moment(day).format('HH:mm:ss');
    let startWorkHour = moment(first_day[0]).format('HH:mm:ss');
    let workOff_hour = moment(last_day[0]).format('HH:mm:ss');
    if (moment(day).isBetween(first_day[0], last_day[0])) {
      if(availableDays.includes(dayName)) {
          return (moment(meeting_started_at, 'HH:mm:ss').isBetween(moment(startWorkHour, 'HH:mm:ss'), moment(workOff_hour, 'HH:mm:ss')) 
          && moment(finished_at,'HH:mm:ss').isBetween(moment(startWorkHour,'HH:mm:ss'), moment(workOff_hour,'HH:mm:ss')))
      }
    } else return false;
  }


  isAvailableHour(day, finished_at, meetings) {

    let started_at = moment(day);
    let index=0;
    return new Promise((resolve, reject) => {
       if(meetings.length === 0) resolve(true);
       else {
           meetings.forEach((meeting)=> {
               let meeting_start = meeting?.started_at;
               let meeting_end = meeting?.finished_at;
               if (moment(day).isBetween(moment(meeting_start), moment(meeting_end)) 
               || moment(finished_at).isBetween(moment(meeting_start), moment(meeting_end))) {
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

  getData(sales, day, finished_at) {
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
          finished_at
        )
      )
        resolve(sales_json);
      else resolve(null);
    });
  }

  getAvailableSales(req, res, next) {
      let day  = req.body?.day || Object.keys(req.body)[0];
      let finished_ = req.body?.finished_at || "";
      let finished_at = "";
      let availableSales = [];

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
        if (result && result.length !== 0) {
          let promise = new Promise(function (resolve, reject) {
              result.forEach((sale) => { 
                let duration = sale?.params?.availability?.duration
                 finished_at = finished_ || moment(day).add(+duration, 'minutes');
                 _this.getData(sale, day, finished_at.format('HH:mm:ss')).then((availableSale) => {

                     if (availableSale) { 
                        _this.db["meetings"]
                        .findAll({
                          where: {
                            active: "Y",
                            user_id: availableSale.user_id,
                          },
                        })
                        .then((meetings) => {
                            _this.isAvailableHour(day,  finished_at, meetings).then(data_meetings => {
                                   
                                if(data_meetings){
                                    availableSale.meetings = meetings;
                                    availableSales = [...availableSales, availableSale];
                                    // availableSales.push(availableSale);
                           }
                           if (indexCallFile < result.length - 1 ) {
                            indexCallFile++;
                        } else {
                            resolve(availableSales);
                        }

                        }).catch((err) => {
                          let res = [];
                          let messages = "Cannot fetch data from database Meetings";
                          this.sendResponseError(res, messages, err, (status = 500));
                        }); 
                    })
                } else {
                    if (indexCallFile < result.length - 1 ) {
                        indexCallFile++;
                    } else {
                        resolve(availableSales);
                    }
                }
              }).catch((err) => {
                let res = [];
                let messages = "Cannot fetch data from database Meetings";
                this.sendResponseError(res, messages, err, (status = 500));
              }); ;
            });  
          });
          Promise.all([promise]).then((availableSales) => {
            res.send({
              message: "Success",
              success: true,
              result: availableSales[0],
            });
          }) 
          .catch(err => {
            let res = [];
            let messages = "Cannot fetch data from database";
            this.sendResponseError(res, messages, err, (status = 500));
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

        let sales_id = req.body.user_id
        let started_at = req.body.started_at
        let finished_at = req.body.finished_at

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
