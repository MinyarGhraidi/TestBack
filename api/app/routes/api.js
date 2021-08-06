let multer = require("multer");
const path = require("path");
let appDir = path.dirname(require.main.filename);

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, appDir + "/app/resources/efiles/public/upload/");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now());
  },
});

let max_upload_size = 50 * 1024 * 1024;

let upload = multer({
  storage: storage,
  limits: {
    fileSize: max_upload_size,
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
lookupController = require('../controllers/lookups.controller')

//                         ====> don't forget to re-add : passport.authenticate('jwt', {session: false}) <=====

let apiRouters = function (passport) {
  // Generic routers
  router.get(
    "/api/generateTokenForUser",
    utilityController.generateTokenForUser
  );

  // account routers
  router.post("/api/account/find", accountController.find);
  router.get("/api/account/findById/:entity_id", accountController.findById);
  router.put("/api/account/update", accountController.update);
  router.delete("/api/account/delete/:params", accountController.delete);
  router.post("/api/account/save", accountController.save);

  router.post("/api/account/signin", accountController.signIn);
  router.post(
    "/api/account/getAccountByToken",
    passport.authenticate("jwt", { session: false }),
    accountController.getAccountByToken
  );

  // campaigns routers
  router.post("/api/campaign/find", campaignController.find);
  router.get("/api/campaign/findById/:entity_id", campaignController.findById);
  router.put("/api/campaign/update", campaignController.update);
  router.delete("/api/campaign/delete/:params", campaignController.delete);
  router.post("/api/campaign/save", campaignController.save);

  //role routers
  router.post("/api/role/find/:params?", rolesController.find);
  router.get("/api/role/findById/:entity_id", rolesController.findById);
  router.put("/api/role/update", rolesController.update);
  router.delete("/api/role/delete/:params", rolesController.delete);
  router.post("/api/role/save", rolesController.save);

  //user routers
  router.post("/api/user/find/:params?", usersController.find);
  router.get("/api/user/findById/:entity_id", usersController.findById);
  router.put("/api/user/update", usersController.update);
  router.delete("/api/user/delete/:params", usersController.delete);
  router.post("/api/user/save", usersController.save);

  router.post("/api/user/signin", usersController.signIn);
  router.post(
    "/api/user/getUserByToken",
    passport.authenticate("jwt", { session: false }),
    usersController.getUserByToken
  );

  router.post("/api/signup", usersController.signUp);
  router.post("/api/signin", usersController.signIn);

  //agents routers
  router.post("/api/agent/find/:params?", agentsController.find);
  router.get("/api/agent/findById/:entity_id", agentsController.findById);
  router.put("/api/agent/update", agentsController.update);
  router.delete("/api/agent/delete/:params", agentsController.delete);
  router.post("/api/agent/save", agentsController.save);

  router.post("/api/signup", agentsController.signUp);
  router.post("/api/signin", agentsController.signIn);

  //Lookups

  // account routers
  router.post(
    "/api/lookup/find",
    passport.authenticate("jwt", { session: false }),
    lookupController.find
  );
  router.get(
    "/api/lookup/findById/:entity_id",
    passport.authenticate("jwt", { session: false }),
    lookupController.findById
  );
  router.put(
    "/api/lookup/update",
    passport.authenticate("jwt", { session: false }),
    lookupController.update
  );
  router.delete(
    "/api/lookup/delete/:params",
    passport.authenticate("jwt", { session: false }),
    lookupController.delete
  );
  router.post(
    "/api/lookup/save",
    passport.authenticate("jwt", { session: false }),
    lookupController.save
  );

  //efiles routers
  router.post("/api/efile/find/:params?", efilesController.find);
  router.get("/api/efile/findById/:entity_id", efilesController.findById);
  router.put("/api/efile/update", efilesController.update);
  router.delete("/api/efile/delete/:params", efilesController.delete);
  router.post("/api/efile/save", efilesController.save);
  router.post(
    "/api/uploadFile",
    upload.single("file"),
    efilesController.upload
  );
  router.get(
    "/api/file/thumb/full/:file_id/",
    efilesController.getImageByStyle
  );
  router.get(
    "/api/efile/getListCallFiles/:file_id",
    efilesController.getListCallFiles
  );

  //listcallfiles routers
  router.post("/api/listcallfile/find/:params?", listcallfilesController.find);
  router.get("/api/listcallfile/findById/:entity_id",listcallfilesController.findById );
  router.put("/api/listcallfile/update", listcallfilesController.update);
  router.delete("/api/listcallfile/delete/:params",listcallfilesController.delete);
  router.post("/api/listcallfile/save", listcallfilesController.save);


    // callfiles routers
    router.post("/api/callfile/find", callfileController.find);
    router.get("/api/callfile/findById/:entity_id", callfileController.findById);
    router.put("/api/callfile/update", callfileController.update);
    router.delete("/api/callfile/delete/:params", callfileController.delete);
    router.post("/api/callfile/save", callfileController.save);

  return router;
};
module.exports = apiRouters;
