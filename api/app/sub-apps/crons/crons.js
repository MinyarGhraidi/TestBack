const AddCallFile = require("./addCallFile");
const AddReminder = require("./addReminder");
const MigrateRecords = require("./migrateRecords");
let Cron = require('cron').CronJob;
let addCF = new AddCallFile();
let addReminder = new AddReminder();
let migrateRecords = new MigrateRecords();



//
// let Add_CallFiles = new Cron("* * * * *", async function () {
//     addCF.cronListCallFiles().then(result => {
//         console.log(result)
//     });
// }, null, true, 'Europe/Paris');
//
// let Add_Reminder = new Cron("* * * * *", async function () {
//     addReminder.saveNotificationReminder().then(result => {
//         console.log(result)
//     });
// }, null, true, 'Europe/Paris');

let Migrate_records = new Cron("* * * * * *", async function () {
    migrateRecords.migrateRecords().then(result => {
        console.log(result)
    });
}, null, true, 'Europe/Paris');
//
// Add_CallFiles.start();
// Add_Reminder.start();
Migrate_records.start()
