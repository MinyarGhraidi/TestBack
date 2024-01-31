let multer = require("multer");
const path = require("path");
const ivrController = require("../controllers/ivr.controller");
let appDir = path.dirname(require.main.filename);

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let dirType = "callfiles";
        if (file.mimetype === "audio/mpeg") {
            dirType = "audios";
        }
        cb(null, appDir + "/app/resources/efiles/public/upload/" + dirType + "/");
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now());
    },
});
let upload = multer({
    storage: storage,
    limits: {
        fileSize: 20000000000
    },
});

let router = require("express").Router(),
    accountController = require("../controllers/account.controller");
utilityController = require("../controllers/utility.controller");
campaignController = require("../controllers/campaign.controller");
callfileController = require("../controllers/callfile.controller");
rolesController = require("../controllers/roles.controller");
usersController = require("../controllers/users.controller");
agentsController = require("../controllers/agents.controller");
efilesController = require("../controllers/efiles.controller");
listcallfilesController = require("../controllers/listcallfiles.controller");
lookupController = require('../controllers/lookups.controller');
truncksController = require('../controllers/truncks.controller');
callstatusController = require('../controllers/callstatus.controller');
pausestatusController = require('../controllers/pausestatus.controller');
didsgroupsController = require('../controllers/didgroups.controller');
audiosController = require('../controllers/audio.controller');
agent_log_eventsController = require('../controllers/agent_log_events.controller');
meetingsController = require('../controllers/meeting.controller');
emailsController = require('../controllers/email.controller');
roles_crmController = require('../controllers/roles_crm.controller');
acl_Controller = require('../controllers/Permissionacl.controller');
sales_Controller = require('../controllers/sales.controller');
liveCallsController = require('../controllers/livecalls.Controller');
roles_crmsController = require('../controllers/roles_crm.controller');
didsController = require('../controllers/dids.controller');
callBlundingController = require('../controllers/callBlunding.controller');
MessageController = require('../controllers/messageController');
MessageChannelController = require('../controllers/message_channelController');
EfileController = require('../controllers/efiles.controller');
UserDataIndexController = require('../controllers/user_indexs.controller');
dialpanItemsController = require('../controllers/dialplanItems.controller');
accController = require('../controllers/acc.controller');
TemplateListCallFile = require('../controllers/templateList.controller');
DomainController = require('../controllers/domain.controller');
AclController = require('../controllers/acl.controller');
AclNodesController = require('../controllers/acl_nodes.controller');
ServersController = require('../controllers/server.controller');
EslServersController = require('../controllers/esl_server.controller');
CallhistoryController = require('../controllers/callhistory.controller');
NotificationsController = require('../controllers/notifications.controller');
ReminderController = require('../controllers/reminder.controller');
HooperController = require('../controllers/hooper.controller');
IVRController = require('../controllers/ivr.controller');

let apiRouters = function (passport) {

    // Generic routers
    router.post("/api/changeCrmStatus/",passport.authenticate('jwt', {session: false}), agentsController.changeCrmStatus);
    // notifications
    router.post("/api/notification/SaveNotification",passport.authenticate('jwt', {session: false}), NotificationsController.SaveNotification);
    router.post("/api/notification/save",passport.authenticate('jwt', {session: false}), NotificationsController.save);
    router.put("/api/notification/update",passport.authenticate('jwt', {session: false}), NotificationsController.update);
    router.post("/api/notification/findNotification",passport.authenticate('jwt', {session: false}), NotificationsController.findNotification);
    router.put("/api/notification/updateByAccountID", passport.authenticate('jwt', {session: false}), NotificationsController.updateByAccountID);

    // account routers
    router.post("/api/account/find", passport.authenticate('jwt', {session: false}), accountController.find);
    router.post("/api/account/changeStatus", passport.authenticate('jwt', {session: false}), accountController.changeStatusByIdAcc);
    router.get("/api/account/findById/:entity_id", passport.authenticate('jwt', {session: false}), accountController.findById);
    router.put("/api/account/update", passport.authenticate('jwt', {session: false}), accountController.AddEditAccount);
    router.delete("/api/account/delete/:params", passport.authenticate('jwt', {session: false}), accountController.delete);
    router.post("/api/account/save", passport.authenticate('jwt', {session: false}), accountController.AddEditAccount);
    router.post("/api/account/deleteAccount", passport.authenticate('jwt', {session: false}), accountController.deleteAccount);
    router.post("/api/account/getAccountByToken", passport.authenticate("jwt", {session: false}), accountController.getAccountByToken);
    router.post("/api/account/affectDomain", passport.authenticate("jwt", {session: false}), accountController.AffectAccountToDomain);
    router.post("/api/account/getAllUnaffectedDomains", passport.authenticate("jwt", {session: false}), accountController.getAllUnaffectedDomains);
    // campaigns routers
    router.post("/api/campaign/find", passport.authenticate('jwt', {session: false}), campaignController.find);
    router.get("/api/campaign/findById/:entity_id", passport.authenticate('jwt', {session: false}), campaignController.findById);
    router.put("/api/campaign/update", passport.authenticate('jwt', {session: false}), campaignController.update);
    router.delete("/api/campaign/delete/:params", passport.authenticate('jwt', {session: false}), campaignController.delete);
    router.post("/api/campaign/save", passport.authenticate('jwt', {session: false}), campaignController.save);
    router.post("/api/campaign/saveCampaign", passport.authenticate('jwt', {session: false}), campaignController.saveCampaign);
    router.post("/api/campaign/updateCampaign", passport.authenticate('jwt', {session: false}), campaignController.updateCampaign);
    router.post("/api/campaign/cloneCampaign", passport.authenticate('jwt', {session: false}), campaignController.cloneCampaign);
    router.post("/api/campaign/addDefaultPauseCallStatus", passport.authenticate('jwt', {session: false}), campaignController.addDefaultPauseCallStatus);
    router.post("/api/campaign/deleteCampaign", passport.authenticate('jwt', {session: false}), campaignController.deleteCampaign);
    router.post("/api/campaign/getAssignedAgents", passport.authenticate('jwt', {session: false}), campaignController.getAssignedAgents);
    router.post("/api/campaign/assignAgents", passport.authenticate('jwt', {session: false}), campaignController.assignAgents);
    router.post("/api/campaign/changeStatus", passport.authenticate('jwt', {session: false}), campaignController.changeStatus);
    router.post("/api/campaign/switchCampaignAgent", passport.authenticate('jwt', {session: false}), campaignController.switchCampaignAgent);
    router.post("/api/campaign/clearCallsCampaign", passport.authenticate('jwt', {session: false}), campaignController.clearCallsCampaign);


    //role routers
    router.post("/api/role/find/:params?", passport.authenticate('jwt', {session: false}), rolesController.find);
    router.get("/api/role/findById/:entity_id", passport.authenticate('jwt', {session: false}), rolesController.findById);
    router.put("/api/role/update", passport.authenticate('jwt', {session: false}), rolesController.update);
    router.delete("/api/role/delete/:params", passport.authenticate('jwt', {session: false}), rolesController.delete);
    router.post("/api/role/save", passport.authenticate('jwt', {session: false}), rolesController.save);
    router.post("/api/role/saveRole", passport.authenticate('jwt', {session: false}), rolesController.saveRole);
    router.delete("/api/role/deleteRole/:params", passport.authenticate('jwt', {session: false}), rolesController.deleteRole)
    router.delete("/api/role/deleteCascade/:params", passport.authenticate('jwt', {session: false}), rolesController.deleteCascade);
    router.post("/api/role/changeStatus", passport.authenticate('jwt', {session: false}), rolesController.changeStatus)

    //user routers
    router.post("/api/user/find/:params?", passport.authenticate('jwt', {session: false}), usersController.find);
    router.get("/api/user/findById/:entity_id", passport.authenticate('jwt', {session: false}), usersController.findById);
    router.put("/api/user/update", passport.authenticate('jwt', {session: false}), usersController.update);
    router.delete("/api/user/delete/:params", passport.authenticate('jwt', {session: false}), usersController.delete);
    router.post("/api/user/save", passport.authenticate('jwt', {session: false}), usersController.save);
    router.post("/api/user/verifyToken", passport.authenticate('jwt', {session: false}), usersController.verifyToken);
    router.post("/api/user/GenerateUserNameFromLastUser", passport.authenticate('jwt', {session: false}), usersController.GenerateUserNameFromLastUser);

    router.post("/api/user/signin", usersController.signIn);
    router.post("/api/user/getUserByToken", passport.authenticate('jwt', {session: false}), usersController.getUserByToken);
    router.post("/api/user/saveUser", passport.authenticate('jwt', {session: false}), usersController.saveUser);
    router.post("/api/user/validPassword", passport.authenticate('jwt', {session: false}), usersController.validPassword);
    router.post("/api/user/switchToNewAccount", passport.authenticate('jwt', {session: false}), usersController.switchToNewAccount);
    router.post("/api/user/generatedUniqueUsername", passport.authenticate('jwt', {session: false}), usersController.generatedUniqueUsername);
    router.post("/api/user/getSalesByAgent", passport.authenticate('jwt', {session: false}), usersController.getSalesByAgent);
    router.post("/api/user/deleteSalesRepresentative", passport.authenticate('jwt', {session: false}), usersController.deleteSalesRepresentative);
    router.post("/api/user/assignAgentsToSales", passport.authenticate('jwt', {session: false}), usersController.assignAgentsToSales);
    router.post("/api/user/getDataAgent", passport.authenticate('jwt', {session: false}), usersController.getDataAgent);
    router.post("/api/user/cloneSales", passport.authenticate('jwt', {session: false}), usersController.cloneSales);
    router.post("/api/user/updateAcc", passport.authenticate('jwt', {session: false}), usersController.updateAcc);
    //agents routers
    router.post("/api/agent/find/:params?", passport.authenticate('jwt', {session: false}), agentsController.find);
    router.get("/api/agent/findById/:entity_id", passport.authenticate('jwt', {session: false}), agentsController.findById);
    router.put("/api/agent/update", passport.authenticate('jwt', {session: false}), agentsController.update);
    router.delete("/api/agent/delete/:params", passport.authenticate('jwt', {session: false}), agentsController.delete);
    router.post("/api/agent/save", passport.authenticate('jwt', {session: false}), agentsController.save);
    router.post("/api/agent/changeStatus", passport.authenticate('jwt', {session: false}), agentsController.changeStatus);
    router.post("/api/agent/saveAgent", passport.authenticate('jwt', {session: false}), agentsController.saveAgent);
    router.post("/api/agent/updateAgent", passport.authenticate('jwt', {session: false}), agentsController.updateAgent);
    router.post("/api/agent/updateSipDeviceUser", passport.authenticate('jwt', {session: false}), agentsController.updateSipDeviceUser);
    router.post("/api/agent/deleteAgent", passport.authenticate('jwt', {session: false}), agentsController.deleteAgent);
    router.post("/api/agent/onConnect", passport.authenticate('jwt', {session: false}), agentsController.onConnect);
    router.post("/api/agent/disconnectTelco", passport.authenticate('jwt', {session: false}), agentsController.disconnectTelco);
    router.post("/api/agent/getConnectedAgents", passport.authenticate('jwt', {session: false}), agentsController.getConnectedAgents);
    router.post("/api/agent/filterDashboard", passport.authenticate('jwt', {session: false}), agentsController.filterDashboard);
    router.post("/api/agent/DisConnectAgent", passport.authenticate('jwt', {session: false}), agentsController.onDisconnectAgents);
    router.post("/api/agent/logoutAgent", passport.authenticate('jwt', {session: false}), agentsController.logoutAgent);
    router.post("/api/agent/disconnectAgentsByAccountID", passport.authenticate('jwt', {session: false}), agentsController.disconnectAgentsByAccountID);
    router.post("/api/agent/callInQueue",passport.authenticate('jwt',{session: false}), agentsController.callInQueue)
    router.post("/api/agent/getUserBySIP_Username", passport.authenticate('jwt', {session: false}), agentsController.getUserBySIP_Username)

    //Lookups
    // account routers
    router.post("/api/lookup/find", passport.authenticate("jwt", {session: false}), lookupController.find);
    router.get("/api/lookup/findById/:entity_id", passport.authenticate("jwt", {session: false}), lookupController.findById);
    router.put("/api/lookup/update", passport.authenticate("jwt", {session: false}), lookupController.update);
    router.delete("/api/lookup/delete/:params", passport.authenticate("jwt", {session: false}), lookupController.delete);
    router.post("/api/lookup/save", passport.authenticate("jwt", {session: false}), lookupController.save);

    router.post("/api/roles_crms/find", passport.authenticate("jwt", {session: false}), roles_crmController.find);
    router.get("/api/roles_crms/findById/:entity_id", passport.authenticate("jwt", {session: false}), roles_crmController.findById);
    router.put("/api/roles_crms/update", passport.authenticate("jwt", {session: false}), roles_crmController.update);
    router.delete("/api/roles_crms/delete/:params", passport.authenticate("jwt", {session: false}), roles_crmController.delete);
    router.post("/api/roles_crms/save", passport.authenticate("jwt", {session: false}), roles_crmController.save);

    //efiles routers
    router.post("/api/efile/find/:params?", passport.authenticate('jwt', {session: false}), efilesController.find);
    router.get("/api/efile/findById/:entity_id", passport.authenticate('jwt', {session: false}), efilesController.findById);
    router.put("/api/efile/update", passport.authenticate('jwt', {session: false}), efilesController.update);
    router.delete("/api/efile/delete/:params", passport.authenticate('jwt', {session: false}), efilesController.delete);
    router.post("/api/efile/save", passport.authenticate('jwt', {session: false}), efilesController.save);
    router.post("/api/uploadFile", passport.authenticate('jwt', {session: false}), upload.single("file"), efilesController.upload);
    router.get("/api/file/thumb/full/:file_id/", efilesController.getImageByStyle);
    router.get("/api/efile/getListCallFiles/:file_id", passport.authenticate('jwt', {session: false}), efilesController.getListCallFiles);
    router.get("/api/efile/downloadFile/:filename",passport.authenticate('jwt', {session: false}), efilesController.downloadFile);


    //listcallfiles routers
    router.post("/api/listcallfile/find/:params?", passport.authenticate('jwt', {session: false}), listcallfilesController.find);
    router.post("/api/listcallfile/changeStatus", passport.authenticate('jwt', {session: false}), listcallfilesController.changeStatus);
    router.get("/api/listcallfile/findById/:entity_id", passport.authenticate('jwt', {session: false}), listcallfilesController.findById);
    router.put("/api/listcallfile/update", passport.authenticate('jwt', {session: false}), listcallfilesController.update);
    router.delete("/api/listcallfile/delete/:params", passport.authenticate('jwt', {session: false}), listcallfilesController.deleteCascade);
    router.post("/api/listcallfile/save", passport.authenticate('jwt', {session: false}), listcallfilesController.save);
    router.post("/api/listcallfile/getStatsListCallFiles", passport.authenticate('jwt', {session: false}), listcallfilesController.getStatsListCallFiles);
    router.post("/api/listcallfile/CallFileQualification", passport.authenticate('jwt', {session: false}), listcallfilesController.CallFileQualification);
    router.get("/api/listcallfile/downloadCallFile/:filename", passport.authenticate('jwt', {session: false}), listcallfilesController.downloadList);
    router.post("/api/listcallfile/cloneListCallFiles", passport.authenticate('jwt', {session: false}), listcallfilesController.cloneListCallFiles);
    router.post("/api/listcallfile/getStatsListCallFileCallStatus", passport.authenticate('jwt', {session: false}), listcallfilesController.getStatsListCallFileCallStatus);
    router.post("/api/listcallfile/getStatsListCallFileCallStatusCampaign", passport.authenticate('jwt', {session: false}), listcallfilesController.getStatsListCallFileCallStatusCampaign);
    //trunks routers
    router.post("/api/trunk/find/:params?", passport.authenticate('jwt', {session: false}), truncksController.find);
    router.get("/api/trunk/findById/:entity_id", passport.authenticate('jwt', {session: false}), truncksController.findById);
    router.put("/api/trunk/update", passport.authenticate('jwt', {session: false}), truncksController.update);
    router.delete("/api/trunk/delete/:params", passport.authenticate('jwt', {session: false}), truncksController.delete);
    router.post("/api/trunk/save", passport.authenticate('jwt', {session: false}), truncksController.save);
    router.post("/api/trunk/saveTrunk", passport.authenticate('jwt', {session: false}), truncksController.saveTrunk);
    router.post("/api/trunk/updateTrunk", passport.authenticate('jwt', {session: false}), truncksController.updateTrunk);
    router.post("/api/trunk/deleteTrunk", passport.authenticate('jwt', {session: false}), truncksController.deleteTrunk);
    router.post("/api/trunk/changeStatusTrunk", passport.authenticate('jwt', {session: false}), truncksController.changeStatusTrunk);

    //callstatus routers
    router.post("/api/callstatus/find/:params?", passport.authenticate('jwt', {session: false}), callstatusController.find);
    router.get("/api/callstatus/findById/:entity_id", passport.authenticate('jwt', {session: false}), callstatusController.findById);
    router.put("/api/callstatus/update", passport.authenticate('jwt', {session: false}), callstatusController.update);
    router.delete("/api/callstatus/delete/:params", passport.authenticate('jwt', {session: false}), callstatusController.delete);
    router.post("/api/callstatus/save", passport.authenticate('jwt', {session: false}), callstatusController.save);

    //pausestatus routers
    router.post("/api/pausestatus/find/:params?", passport.authenticate('jwt', {session: false}), pausestatusController.find);
    router.get("/api/pausestatus/findById/:entity_id", passport.authenticate('jwt', {session: false}), pausestatusController.findById);
    router.put("/api/pausestatus/update", passport.authenticate('jwt', {session: false}), pausestatusController.update);
    router.delete("/api/pausestatus/delete/:params", passport.authenticate('jwt', {session: false}), pausestatusController.delete);
    router.post("/api/pausestatus/save", passport.authenticate('jwt', {session: false}), pausestatusController.save);
    router.post("/api/pausestatus/findByCampaignId/:params", passport.authenticate('jwt', {session: false}), pausestatusController.findByCampaignId);
    router.post("/api/pausestatus/findByCampaignIdAndSystem", passport.authenticate('jwt', {session: false}), pausestatusController.findByCampIdsAndSystem);

    // callfiles routers
    router.post("/api/callfile/find", passport.authenticate('jwt', {session: false}), callfileController.find);
    router.get("/api/callfile/findById/:entity_id", passport.authenticate('jwt', {session: false}), callfileController.findById);
    router.put("/api/callfile/update", passport.authenticate('jwt', {session: false}), callfileController.update);
    router.delete("/api/callfile/delete/:params", passport.authenticate('jwt', {session: false}), callfileController.delete);
    router.post("/api/callfile/save", passport.authenticate('jwt', {session: false}),callfileController.save);
    router.post("/api/callfile/getEntityRevisionByModelId", passport.authenticate('jwt', {session: false}), callfileController.getEntityRevisionByModelId);
    router.get("/api/callfile/play", callfileController.playMediaMusic);
    router.get("/api/callHistory/play/:record_name", CallhistoryController.playMedia);
    router.post("/api/callfile/findCallFile", passport.authenticate('jwt', {session: false}), callfileController.findCallFile);
    router.post("/api/callfile/RecycleCallFile", passport.authenticate('jwt', {session: false}), callfileController.RecycleCallFile);
    router.post("/api/callfile/CallBlending", passport.authenticate('jwt', {session: false}), callfileController.getCallBlending);
    router.post("/api/callfile/eavesdrop",passport.authenticate('jwt', {session: false}), callfileController.eavesdrop);
    router.post("/api/callfile/getcallfilessql",passport.authenticate('jwt', {session: false}), callfileController.getCFListsByIDList);

    // dids routers
    router.post("/api/didsgroups/find", passport.authenticate('jwt', {session: false}), didsgroupsController.find);
    router.get("/api/didsgroups/findById/:entity_id", passport.authenticate('jwt', {session: false}), didsgroupsController.findById);
    router.put("/api/didsgroups/update", passport.authenticate('jwt', {session: false}), didsgroupsController.update);
    router.delete("/api/didsgroups/delete/:params", passport.authenticate('jwt', {session: false}), didsgroupsController.delete);
    router.delete("/api/didsgroups/deleteCascade/:params", passport.authenticate('jwt', {session: false}), didsgroupsController.deleteCascade);
    router.post("/api/didsgroups/save", passport.authenticate('jwt', {session: false}), didsgroupsController.save);
    router.post("/api/didsgroups/affectDidsGpToCamp", passport.authenticate('jwt', {session: false}), didsgroupsController.affectDidsGpToCamp);
    router.post('/api/didsgroups/changeStatus/:params', passport.authenticate('jwt', {session: false}), didsgroupsController.changeStatus);


    router.post("/api/callBlunding/find", passport.authenticate('jwt', {session: false}), callBlundingController.find);
    router.get("/api/callBlunding/findById/:entity_id", passport.authenticate('jwt', {session: false}), callBlundingController.findById);
    router.put("/api/callBlunding/update", passport.authenticate('jwt', {session: false}), callBlundingController.updateCallBlending);
    router.delete("/api/callBlunding/delete/:params", passport.authenticate('jwt', {session: false}), callBlundingController.delete);
    router.post("/api/callBlunding/save", passport.authenticate('jwt', {session: false}), callBlundingController.save);
    router.post("/api/callBlunding/bulkCallBlending", passport.authenticate('jwt', {session: false}), callBlundingController.bulkCallBlending);

    router.post("/api/dids/find", passport.authenticate('jwt', {session: false}), didsController.find);
    router.get("/api/dids/findById/:entity_id", passport.authenticate('jwt', {session: false}), didsController.findById);
    router.put("/api/dids/update", passport.authenticate('jwt', {session: false}), didsController.update);
    router.delete("/api/dids/delete/:params", passport.authenticate('jwt', {session: false}), didsController.delete);
    router.post("/api/dids/saveBulk", passport.authenticate('jwt', {session: false}), didsController.saveBulk);
    router.post("/api/dids/save", passport.authenticate('jwt', {session: false}), didsController.save);
    router.post("/api/dids/release", passport.authenticate('jwt', {session: false}), didsController.deleteDiD);

    // audios routers
    router.post("/api/audio/find", passport.authenticate('jwt', {session: false}), audiosController.find);
    router.get("/api/audio/findById/:entity_id", passport.authenticate('jwt', {session: false}), audiosController.findById);
    router.put("/api/audio/update", passport.authenticate('jwt', {session: false}), audiosController.update);
    router.delete("/api/audio/delete/:params", passport.authenticate('jwt', {session: false}), audiosController.delete);
    router.post("/api/audio/save", passport.authenticate('jwt', {session: false}), audiosController.save);

    // agent_log_events routers
    router.post("/api/agent_log_event/find", passport.authenticate('jwt', {session: false}), agent_log_eventsController.find);
    router.get("/api/agent_log_event/findById/:entity_id", passport.authenticate('jwt', {session: false}), agent_log_eventsController.findById);
    router.put("/api/agent_log_event/update", passport.authenticate('jwt', {session: false}), agent_log_eventsController.update);
    router.delete("/api/agent_log_event/delete/:params", passport.authenticate('jwt', {session: false}), agent_log_eventsController.delete);
    router.post("/api/agent_log_event/save", passport.authenticate('jwt', {session: false}), agent_log_eventsController.save);
    router.post("/api/agent_log_event/getLastEvent", passport.authenticate('jwt', {session: false}), agent_log_eventsController.getLastEvent);

    // meetings routes
    router.post("/api/meeting/find", passport.authenticate('jwt', {session: false}), meetingsController.find);
    router.get("/api/meeting/findById/:entity_id", passport.authenticate('jwt', {session: false}), meetingsController.findById);
    router.put("/api/meeting/update", passport.authenticate('jwt', {session: false}), meetingsController.update);
    router.delete("/api/meeting/delete/:params", passport.authenticate('jwt', {session: false}), meetingsController.delete);
    router.post("/api/meeting/save", passport.authenticate('jwt', {session: false}), meetingsController.save);
    router.post("/api/meeting/getAvailableSales", passport.authenticate('jwt', {session: false}), meetingsController.getAvailableSales);

    //roles_crm
    router.post("/api/roles_crm/find", passport.authenticate('jwt', {session: false}), roles_crmController.find);
    router.get("/api/roles_crm/findById/:entity_id", passport.authenticate('jwt', {session: false}), roles_crmController.findById);
    router.put("/api/roles_crm/update", passport.authenticate('jwt', {session: false}), roles_crmController.update);
    router.delete("/api/roles_crm/delete/:params", passport.authenticate('jwt', {session: false}), roles_crmController.delete);
    router.post("/api/roles_crm/save", passport.authenticate('jwt', {session: false}), roles_crmController.save);

    // emails routes
    router.post("/api/email/find", passport.authenticate('jwt', {session: false}), emailsController.find);
    router.get("/api/email/findById/:entity_id", passport.authenticate('jwt', {session: false}), emailsController.findById);
    router.put("/api/email/update", passport.authenticate('jwt', {session: false}), emailsController.update);
    router.delete("/api/email/delete/:params", passport.authenticate('jwt', {session: false}), emailsController.delete);
    router.post("/api/email/save", passport.authenticate('jwt', {session: false}), emailsController.save);

    router.post("/api/acl/find", passport.authenticate('jwt', {session: false}), acl_Controller.find);
    router.get("/api/acl/findById/:entity_id", passport.authenticate('jwt', {session: false}), acl_Controller.findById);
    router.put("/api/acl/update", passport.authenticate('jwt', {session: false}), acl_Controller.update);
    router.delete("/api/acl/delete/:params", passport.authenticate('jwt', {session: false}), acl_Controller.delete);
    router.post("/api/acl/save", passport.authenticate('jwt', {session: false}), acl_Controller.save);

    router.post("/api/sales/all_meetings", passport.authenticate('jwt', {session: false}), sales_Controller.getAllMeetings);
    router.post("/api/sales/agents_sales", passport.authenticate('jwt', {session: false}), sales_Controller.agents_for_sales)
    router.post("/api/callstatus/changeStatus", passport.authenticate('jwt', {session: false}), callstatusController.changeStatus)

    //livecalls

    router.post("/api/livecalls/find", passport.authenticate('jwt', {session: false}), liveCallsController.find);
    router.get("/api/livecalls/findById/:entity_id", passport.authenticate('jwt', {session: false}), liveCallsController.findById);
    router.put("/api/livecalls/update", passport.authenticate('jwt', {session: false}), liveCallsController.update);
    router.delete("/api/livecalls/delete/:params", passport.authenticate('jwt', {session: false}), liveCallsController.delete);
    router.post("/api/livecalls/save", passport.authenticate('jwt', {session: false}), liveCallsController.save);
    router.post("/api/livecalls/getLiveCallsByCallId", passport.authenticate('jwt', {session: false}), liveCallsController.getLiveCallsByCallId);
    router.post("/api/livecalls/getLiveCallsByAccount", passport.authenticate('jwt', {session: false}), liveCallsController.getLiveCallsByAccount);
    router.post("/api/livecalls/getLiveCallsByCampaign", passport.authenticate('jwt', {session: false}), liveCallsController.getLiveCallsByCampaign);

    router.post('/api/callfile/UpdateCall', passport.authenticate('jwt', {session: false}), callfileController.updateCallFileQualification)
    router.post('/api/callfile/leadsStats', passport.authenticate('jwt', {session: false}), callfileController.leadsStats)
    router.post('/api/callfile/leadsStatsExport', passport.authenticate('jwt', {session: false}), callfileController.leadsStatsExport)
    router.post('/api/callfile/getHistoryCallFile', passport.authenticate('jwt', {session: false}), callfileController.getHistoryCallFile)
    router.post('/api/callfile/getCustomFields', passport.authenticate('jwt', {session: false}), callfileController.getCustomFields)


    router.post('/api/message/save', passport.authenticate('jwt', {session: false}), MessageController.save);
    router.get('/api/message/get/:params?', passport.authenticate('jwt', {session: false}), MessageController.get);
    router.get('/api/message/getById/:params', passport.authenticate('jwt', {session: false}), MessageController.getById);
    router.put('/api/message/update', passport.authenticate('jwt', {session: false}), MessageController.update);
    router.delete('/api/message/delete/:params', passport.authenticate('jwt', {session: false}), MessageController.delete);

    router.put('/api/message_channel/update', passport.authenticate('jwt', {session: false}), MessageChannelController.update);
    router.post('/api/message_channel/createNewChannel', passport.authenticate('jwt', {session: false}), MessageChannelController.createNewChannel);
    router.post('/api/message_channel/sendNewMessage', passport.authenticate('jwt', {session: false}), MessageChannelController.sendNewMessage);
    router.post('/api/message_channel/getMyChannel', passport.authenticate('jwt', {session: false}), MessageChannelController.getMyChannel);
    router.post('/api/message_channel/getContactsChannel', passport.authenticate('jwt', {session: false}), MessageChannelController.getContactsChannel);
    router.post('/api/message_channel/getAllUsersChannel', passport.authenticate('jwt', {session: false}), MessageChannelController.getAllUsersChannel);
    router.post('/api/message_channel/getMessageChannel', passport.authenticate('jwt', {session: false}), MessageChannelController.getChannelMessages);
    router.post('/api/message_channel/updateMessageChannelSubscribes', passport.authenticate('jwt', {session: false}), MessageChannelController.updateMessageChannelSubscribes);
    router.post('/api/message_channel/addSubscribersToChannel', passport.authenticate('jwt', {session: false}), MessageChannelController.addSubscribersToChannel);

    router.post("/api/userDataIndexs/find/:params?", passport.authenticate('jwt', {session: false}), UserDataIndexController.find);
    router.get("/api/userDataIndexs/findById/:entity_id", passport.authenticate('jwt', {session: false}), UserDataIndexController.findById);
    router.put("/api/userDataIndexs/update", passport.authenticate('jwt', {session: false}), UserDataIndexController.update);
    router.delete("/api/userDataIndexs/delete/:params", passport.authenticate('jwt', {session: false}), UserDataIndexController.delete);
    router.post("/api/userDataIndexs/save", passport.authenticate('jwt', {session: false}), UserDataIndexController.save);

    router.post('/api/dialplanItems/find/:params?', passport.authenticate('jwt', {session: false}), dialpanItemsController.find);
    router.get('/api/dialplanItems/findById/:entity_id', passport.authenticate('jwt', {session: false}), dialpanItemsController.findById);
    router.put('/api/dialplanItems/update', passport.authenticate('jwt', {session: false}), dialpanItemsController.update);
    router.delete('/api/dialplanItems/delete/:params', passport.authenticate('jwt', {session: false}), dialpanItemsController.delete);
    router.post('/api/dialplanItems/save', passport.authenticate('jwt', {session: false}), dialpanItemsController.save);

    router.post('/api/acc/getCdrs/:params?', passport.authenticate('jwt', {session: false}), accController.getCdrs);
    router.post('/api/acc/agentCallReports/:params?', passport.authenticate('jwt', {session: false}), agentsController.agentCallReports);
    router.post('/api/acc/listCallFileReports/:params?', passport.authenticate('jwt', {session: false}), agentsController.listCallFileReports);
    router.post('/api/acc/pauseStatusReports/:params?', passport.authenticate('jwt', {session: false}), agentsController.pauseStatusReports);
    router.post('/api/acc/vmdReports', passport.authenticate('jwt', {session: false}), agentsController.vmdReports);
    router.post('/api/acc/getSip_codes', passport.authenticate('jwt', {session: false}), accController.getSip_codes);
    router.post('/api/acc/exportCSV', passport.authenticate('jwt', {session: false}), accController.exportCSV);

    router.post('/api/templateList/save', passport.authenticate('jwt', {session: false}), TemplateListCallFile.save);
    router.put('/api/templateList/update', passport.authenticate('jwt', {session: false}), TemplateListCallFile.update);
    router.post('/api/templateList/find', passport.authenticate('jwt', {session: false}), TemplateListCallFile.find);
    router.get('/api/templateList/findById/:entity_id', passport.authenticate('jwt', {session: false}), TemplateListCallFile.findById);
    router.delete('/api/templateList/delete/:params', passport.authenticate('jwt', {session: false}), TemplateListCallFile.delete);
    router.put('/api/templateList/update', passport.authenticate('jwt', {session: false}), TemplateListCallFile.update);
    router.post("/api/templateList/changeStatus", passport.authenticate('jwt', {session: false}), TemplateListCallFile.changeStatus);
    router.post("/api/templateList/deleteTemplate", passport.authenticate('jwt', {session: false}), TemplateListCallFile.deleteTemplate);

    router.post('/api/agent/agentReports', passport.authenticate('jwt', {session: false}),  agentsController.agentDetailsReports);

//-------------------> Domain API
    router.post('/api/domain/save',passport.authenticate('jwt', {session: false}), DomainController.saveDomain);
    router.post('/api/domain/find',passport.authenticate('jwt', {session: false}), DomainController.find);
    router.get('/api/domain/findById/:entity_id', passport.authenticate('jwt', {session: false}), DomainController.findById);
    router.put('/api/domain/update',passport.authenticate('jwt', {session: false}), DomainController.updateDomain);
    router.delete('/api/domain/delete/:domain_id',passport.authenticate('jwt', {session: false}), DomainController.deleteDomain);

//-------------------> ACL API
    router.post('/api/acls/save',passport.authenticate('jwt', {session: false}), AclController.saveAcl);
    router.post('/api/acls/find',passport.authenticate('jwt', {session: false}), AclController.find);
    router.put('/api/acls/update',passport.authenticate('jwt', {session: false}), AclController.updateAcl);
    router.delete('/api/acls/delete/:acl_id',passport.authenticate('jwt', {session: false}), AclController.deleteAcl);

//-------------------> ACL NODES API
    router.post('/api/acl_nodes/save',passport.authenticate('jwt', {session: false}), AclNodesController.saveAclNode);
    router.post('/api/acl_nodes/find',passport.authenticate('jwt', {session: false}), AclNodesController.find);
    router.put('/api/acl_nodes/update',passport.authenticate('jwt', {session: false}), AclNodesController.updateAclNode);
    router.delete('/api/acl_nodes/delete/:acl_node_id',passport.authenticate('jwt', {session: false}), AclNodesController.deleteAclNode);

//--------------------> SERVERS API

    router.post('/api/server/save',passport.authenticate('jwt', {session: false}), ServersController.addServer);
    router.post('/api/server/find',passport.authenticate('jwt', {session: false}), ServersController.find);
    router.get('/api/server/findById/:entity_id', passport.authenticate('jwt', {session: false}), ServersController.findById);
    router.put('/api/server/update',passport.authenticate('jwt', {session: false}), ServersController.editServer);
    router.delete('/api/server/delete/:server_id',passport.authenticate('jwt', {session: false}), ServersController.deleteServer);

//-----------------------> ESL SERVERS API  addEslServer
    router.post('/api/esl_server/save',passport.authenticate('jwt', {session: false}), EslServersController.addEslServer);
    router.post('/api/esl_server/find',passport.authenticate('jwt', {session: false}), EslServersController.find);
    router.post('/api/esl_server/changeStatusServer',passport.authenticate('jwt', {session: false}), EslServersController.changeStatusServer);
    router.get('/api/esl_server/findById/:entity_id', passport.authenticate('jwt', {session: false}), EslServersController.findById);
    router.put('/api/esl_server/update',passport.authenticate('jwt', {session: false}), EslServersController.editEslServer);
    router.delete('/api/esl_server/delete/:esl_server_id',passport.authenticate('jwt', {session: false}), EslServersController.deleteEslServer);

    router.put('/api/callhistory/update',passport.authenticate('jwt', {session: false}),CallhistoryController.update);
    router.post('/api/callhistory/updateCallhistory',passport.authenticate('jwt', {session: false}),CallhistoryController.updateCall);


    router.post('/api/reminder/findAllReminders',passport.authenticate('jwt', {session: false}), ReminderController.findAllReminders);
    router.post('/api/reminder/find/:params?', passport.authenticate('jwt', {session: false}), ReminderController.find);
    router.get('/api/reminder/findById/:entity_id', passport.authenticate('jwt', {session: false}), ReminderController.findById);
    router.put('/api/reminder/update', passport.authenticate('jwt', {session: false}), ReminderController.update);
    router.delete('/api/reminder/delete/:params', passport.authenticate('jwt', {session: false}), ReminderController.delete);
    router.post('/api/reminder/save', passport.authenticate('jwt', {session: false}), ReminderController.save);

    router.post('/api/hooper/findHooper', passport.authenticate('jwt', {session: false}), HooperController.findHooper);
    router.get('/api/hooper/findById/:entity_id', passport.authenticate('jwt', {session: false}), HooperController.findById);
    router.post('/api/campaign/deleteHooper',passport.authenticate('jwt', {session: false}),campaignController.resetHooper);
    router.post('/api/campaign/getCampaignsByDID_ID',passport.authenticate('jwt', {session: false}),campaignController.getCampaignsByDID_ID);

    router.post('/api/dialplanItems/findTrunck', passport.authenticate('jwt', {session: false}), dialpanItemsController.getDialPlan);
    router.post('/api/dialplanItems/changeStatusDialPlan', passport.authenticate('jwt', {session: false}), dialpanItemsController.changeStatusDialPlan);


//-------------------------------------> IVR_MENU
    
    router.put('/api/ivr_menus/update',passport.authenticate('jwt', {session: false}), IVRController.updateIVR);
    router.delete("/api/ivr_menus/delete/:params", passport.authenticate('jwt', {session: false}), IVRController.deleteIVR);
    
    router.post("/api/ivr_menus/findByCampaignId/:params", passport.authenticate('jwt', {session: false}), IVRController.findByCID);
    router.post("/api/ivr_menus/find/:params?", passport.authenticate('jwt', {session: false}), IVRController.find);
    router.get("/api/ivr_menus/findById/:entity_id", passport.authenticate('jwt', {session: false}), IVRController.findById);
    router.post('/api/ivr_menus/save', passport.authenticate('jwt', {session: false}), IVRController.saveIVR);

    return router;


};
module.exports = apiRouters;
