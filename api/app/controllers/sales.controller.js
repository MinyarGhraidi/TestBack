const salesDao = require('../bo/salesbo');
let salesDaoInst = new salesDao;

module.exports ={
    getAllMeetings : function (req, res, next){
        salesDaoInst.getAllMeetings(req, res, next)
    },
    agents_for_sales: function (req, res, next){
        salesDaoInst.agents_for_sales(req, res, next)
    }
}