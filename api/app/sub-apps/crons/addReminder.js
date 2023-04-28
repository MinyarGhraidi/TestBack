const {baseModelbo} = require("../../bo/basebo");
const db = require("../../models");
const Op = require("sequelize/lib/operators");
const moment = require("moment/moment");
const appSocket = new (require("../../providers/AppSocket"))();

class AddReminder extends baseModelbo {
    addMinutesToTime(minutes, timeString) {
        const [hours, mins] = timeString.split(":").map(Number);
        const totalMins = hours * 60 + mins + minutes;
        const newHours = Math.floor(totalMins / 60) % 24;
        const newMins = totalMins % 60;
        const formattedHours = newHours.toString().padStart(2, "0");
        const formattedMins = newMins.toString().padStart(2, "0");
        const beforeMidnight = [];
        const afterMidnight = [];
        let currentHours = hours;
        let currentMins = mins;
        const NewDay = currentHours === newHours;
        while (currentHours !== newHours || currentMins !== newMins) {
            const formattedCurrentHours = currentHours.toString().padStart(2, "0");
            const formattedCurrentMins = currentMins.toString().padStart(2, "0");
            if (currentHours > 0 || NewDay) {
                beforeMidnight.push(`${formattedCurrentHours}:${formattedCurrentMins}`);
            } else {
                afterMidnight.push(`${formattedCurrentHours}:${formattedCurrentMins}`);
            }
            currentMins += 1;
            if (currentMins === 60) {
                currentMins = 0;
                currentHours += 1;
                if (currentHours === 24) {
                    currentHours = 0;
                }
            }
        }
        if (currentHours > 0 || NewDay) {
            beforeMidnight.push(`${formattedHours}:${formattedMins}`);
        } else {
            afterMidnight.push(`${formattedHours}:${formattedMins}`);
        }
        return { beforeMidnight, afterMidnight};
    }
    saveNotificationReminder(){
        return new Promise((resolve,reject)=>{
            let currDate = new Date();
            let hoursMin = currDate.getHours() + ':' + currDate.getMinutes();
            const tomorrow = new Date(currDate.getTime() + 24 * 60 * 60 * 1000);
            const yyyy_Now = currDate.getFullYear();
            const yyyy_Tomorrow = tomorrow.getFullYear();
            let mm_Now = currDate.getMonth() + 1;
            let mm_Tomorrow = tomorrow.getMonth() + 1;
            let dd_Now = currDate.getDate();
            let dd_Tomorrow = tomorrow.getDate();
            if (dd_Now < 10) dd_Now = '0' + dd_Now;
            if (mm_Now < 10) mm_Now = '0' + mm_Now;
            if (dd_Tomorrow < 10) dd_Tomorrow = '0' + dd_Tomorrow;
            if (mm_Tomorrow < 10) mm_Tomorrow = '0' + mm_Tomorrow;
            const formattedToday = yyyy_Now + '-' + mm_Now + '-' + dd_Now;
            const formattedTomorrow = yyyy_Tomorrow + '-' + mm_Tomorrow + '-' + dd_Tomorrow;
            const ArrayTimes = this.addMinutesToTime(15,hoursMin);
            this.db['reminders'].findAll({
                include: [{
                    model: db.notifications,
                    required : false
                },{
                    model: db.callfiles
                }
                ],
                where : {
                    active: 'Y',
                    [Op.or]: [
                        { date : formattedToday, time : ArrayTimes.beforeMidnight},
                        { date : formattedTomorrow, time : ArrayTimes.afterMidnight}
                    ],
                    '$notifications.reminder_id$' : null
                }
            }).then(resultData =>{
                if(resultData && resultData.length !== 0){
                    let idx = 0;
                    resultData.forEach(reminder =>{
                        let DateTZ = moment(new Date());
                        let data = {
                            data: {
                                agent_id: reminder.agent_id,
                                Date_Time: reminder.date + ' '+reminder.time,
                                callfile: {
                                    note : reminder.callfile.note,
                                    first_name : reminder.callfile.first_name,
                                    last_name : reminder.callfile.last_name,
                                    phone_number : reminder.callfile.phone_number,
                                }
                            },
                            reminder_id : reminder.reminder_id,
                            status: 'Y',
                            created_at: DateTZ,
                            updated_at: DateTZ
                        }
                        let modalObj = this.db['notifications'].build(data);
                        modalObj.save().then(() => {
                            appSocket.emit('save_notification', {
                                target : 'reminder',
                                agent_id : reminder.agent_id,
                            });
                            if(idx < resultData.length -1){
                                idx++;
                            }else{
                                return resolve({cron : "saveNotificationReminder", message : resultData.length + ' Reminders Added to Notifications !'})
                            }
                        })
                    })
                }else{
                    return resolve({
                        cron : "saveNotificationReminder",
                        message : "Nothing To Add !"
                    })
                }
            }).catch(err => {
                return resolve({success: false, error: err})
            })
        })
    }
}
module.exports = AddReminder