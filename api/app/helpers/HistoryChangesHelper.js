const db = require("../models");
const systemConfig = require("../config/app.config");

const HistoryChange = db.HistoryChange;


exports.SaveHistoryChange = async (_HistoryChange) => {

    var today = new Date();
    var time = today.toISOString().slice(0, 10) + "  " + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    _HistoryChange.action_date = time;
    _HistoryChange.user_id = _HistoryChange.user_id || systemConfig.userSystem
    let restult = await HistoryChange.create(_HistoryChange).then()
        .catch(err => console.log("error loger"));
        
}