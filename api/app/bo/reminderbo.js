const {baseModelbo} = require("./basebo");

class Reminderbo extends baseModelbo{
    constructor() {
        super('reminders', 'reminder_id');
        this.baseModal = "reminders";
        this.primaryKey = 'reminder_id';
    }
}

module.exports = Reminderbo
