const AddCallFile = require("./addCallFile");
let Cron = require('cron').CronJob;
let addCF = new AddCallFile();




let Add_CallFiles = new Cron("* * * * *", async function () {
    addCF.cronListCallFiles().then(result => {
        console.log('result', result)
    });
}, null, true, 'Europe/Paris');

Add_CallFiles.start();