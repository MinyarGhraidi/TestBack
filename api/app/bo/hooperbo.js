const {baseModelbo} = require("./basebo");

class Hooperbo extends baseModelbo{
    constructor() {
        super('hoopers', 'id');
        this.baseModal = "hoopers";
        this.primaryKey = 'id';
    }

    listCallByaccount (req, res, next){
        let account_id = req.body.account_id
    }
}

module.exports=Hooperbo
