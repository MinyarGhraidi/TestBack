const AddCallFile = require("./addCallFile");
const AddReminder = require("./addReminder");
const MigrateRecords = require("./migrateRecords");
const KillSessions = require("./killSessions");
const DeleteHooper = require("./deleteHooper");
const StatsListLeads = require("./statsListLeads");
let Cron = require('cron').CronJob;
let addCF = new AddCallFile();
let killSession = new KillSessions();
let addReminder = new AddReminder();
let deleteHooper = new DeleteHooper();
let statsListLeads = new StatsListLeads();

let Add_CallFiles = new Cron("* * * * *", async function () {
    addCF.cronListCallFiles().then(result => {
        console.log(result)
    });
}, null, true, 'Europe/Paris');

let Kill_Sessions = new Cron("55 23 * * *", async function () {
    killSession.cronKillSessions().then(result => {
        console.log(result)
    });
}, null, true, 'Europe/Paris');

let Add_Reminder = new Cron("* * * * *", async function () {
    addReminder.saveNotificationReminder().then(result => {
        console.log(result)
    });
}, null, true, 'Europe/Paris');

let DeleteHoopers = new Cron("*/15 * * * *", async function () {
    deleteHooper.deleteHooper().then(result => {
        console.log(result)
    });
}, null, true, 'Europe/Paris');

let Stats_listLeads = new Cron("*/15 * * * *", async function () {
    statsListLeads.statsListLeads().then(result => {
        console.log(result)
    });
}, null, true, 'Europe/Paris');

// let Migrate_records = new Cron("* * * * *", async function () {
//     migrateRecords.migrateRecords().then(result => {
//         console.log(result)
//     });
// }, null, true, 'Europe/Paris');

Add_CallFiles.start();
Add_Reminder.start();
Kill_Sessions.start();
DeleteHoopers.start();
Stats_listLeads.start();
// Migrate_records.start()
