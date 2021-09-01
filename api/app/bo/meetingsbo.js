const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
let moment = require('moment')
 
class meetings extends baseModelbo {
    constructor() {
        super('meetings', 'meeting_id');
        this.baseModal = "meetings";
        this.primaryKey = 'meeting_id';
    }


    isAvailableDay(day, first_day, last_day, availableDays){ 
        let dayName =  moment(day).format('dddd');
        if(moment(day).isBetween(first_day[0], last_day[0])) {
            return(availableDays.includes(dayName))
        }
        else return false
    }

    getData(sales, day) {
        return new Promise((resolve, reject) => {
                let sales_json = sales.toJSON();
                let first_day = sales_json?.params?.availability?.first_day;
                let last_day = sales_json?.params?.availability?.last_day;
                if (this.isAvailableDay(day, first_day, last_day, sales_json?.params?.availability?.days)) resolve(sales_json)
                else resolve(null);
        });
    }


    getAvailableSales(req, res, next) {
        let {day} = req.body;

const {Op} = db.sequelize;
this.db['users'].findAll({
    where: {
        active: 'Y',
        user_type: 'sales'
    }
}).then( result => {
    let _this = this ;
    let availableSales = [];
    if (result) {
        let promise = new Promise(function (resolve, reject) {
            let index = 0;
            result.forEach( sales => {
                _this.getData(sales, day).then( availableSale =>{
                    console.log('ava', availableSale)
                    if (availableSale) {
                        availableSales = [...availableSales, availableSale];
                    }
                    if (index<result.length-1)
                    {
                        index++;
                    }
                    else {
                        resolve(availableSales);
                    }
                }) 
            })

        })
        Promise.all([promise]).then(availableSales => {
            res.send({
                message: 'Success',
                success: true, 
                result : availableSales[0]
            });
            
        })
    }
})
}
}

module.exports = meetings;