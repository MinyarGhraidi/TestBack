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
rolesController = require("../controllers/roles.controller");
usersController = require("../controllers/users.controller");
agentsController = require("../controllers/agents.controller");
efilesController = require("../controllers/efiles.controller");
listcallfilesController = require("../controllers/listcallfiles.controller");
lookupController = require('../controllers/lookups.controller')
truncksController = require('../controllers/truncks.controller')


//                         ====> don't forget to re-add : passport.authenticate('jwt', {session: false}) <=====

let apiRouters = function (passport) {
  // Generic routers
  router.get(
    "/api/generateTokenForUser",
    utilityController.generateTokenForUser
  );

  // account routers
  router.post("/api/account/find", passport.authenticate('jwt', {session: false}), accountController.find);
  router.get("/api/account/findById/:entity_id", passport.authenticate('jwt', {session: false}), accountController.findById);
  router.put("/api/account/update", passport.authenticate('jwt', {session: false}), accountController.update);
  router.delete("/api/account/delete/:params", passport.authenticate('jwt', {session: false}), accountController.delete);
  router.post("/api/account/save", passport.authenticate('jwt', {session: false}), accountController.save);

  router.post("/api/account/signin", passport.authenticate('jwt', {session: false}), accountController.signIn);
  router.post(
    "/api/account/getAccountByToken",
    passport.authenticate("jwt", { session: false }),
    accountController.getAccountByToken
  );

  // campaigns routers
  router.post("/api/campaign/find", passport.authenticate('jwt', {session: false}), campaignController.find);
  router.get("/api/campaign/findById/:entity_id", passport.authenticate('jwt', {session: false}), campaignController.findById);
  router.put("/api/campaign/update", passport.authenticate('jwt', {session: false}), campaignController.update);
  router.delete("/api/campaign/delete/:params", passport.authenticate('jwt', {session: false}), campaignController.delete);
  router.post("/api/campaign/save", passport.authenticate('jwt', {session: false}), campaignController.save);

  //role routers
  router.post("/api/role/find/:params?", passport.authenticate('jwt', {session: false}), rolesController.find);
  router.get("/api/role/findById/:entity_id", passport.authenticate('jwt', {session: false}), rolesController.findById);
  router.put("/api/role/update", rolesController.update);
  router.delete("/api/role/delete/:params", rolesController.delete);
  router.post("/api/role/save", rolesController.save);

  //user routers
  router.post("/api/user/find/:params?", passport.authenticate('jwt', {session: false}), usersController.find);
  router.get("/api/user/findById/:entity_id", passport.authenticate('jwt', {session: false}), usersController.findById);
  router.put("/api/user/update", passport.authenticate('jwt', {session: false}), usersController.update);
  router.delete("/api/user/delete/:params", passport.authenticate('jwt', {session: false}), usersController.delete);
  router.post("/api/user/save", passport.authenticate('jwt', {session: false}), usersController.save);

  router.post("/api/user/signin",  usersController.signIn);
  router.post(
    "/api/user/getUserByToken",
    usersController.getUserByToken
  );

  router.post("/api/signup", usersController.signUp);
  router.post("/api/signin", usersController.signIn);

  //agents routers
  router.post("/api/agent/find/:params?", passport.authenticate('jwt', {session: false}), agentsController.find);
  router.get("/api/agent/findById/:entity_id", passport.authenticate('jwt', {session: false}), agentsController.findById);
  router.put("/api/agent/update", passport.authenticate('jwt', {session: false}), agentsController.update);
  router.delete("/api/agent/delete/:params", passport.authenticate('jwt', {session: false}), agentsController.delete);
  router.post("/api/agent/save", passport.authenticate('jwt', {session: false}), agentsController.save);

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
  router.post("/api/efile/find/:params?", passport.authenticate('jwt', {session: false}), efilesController.find);
  router.get("/api/efile/findById/:entity_id", passport.authenticate('jwt', {session: false}), efilesController.findById);
  router.put("/api/efile/update", passport.authenticate('jwt', {session: false}), efilesController.update);
  router.delete("/api/efile/delete/:params", passport.authenticate('jwt', {session: false}), efilesController.delete);
  router.post("/api/efile/save", passport.authenticate('jwt', {session: false}), efilesController.save);
  router.post(
    "/api/uploadFile", passport.authenticate('jwt', {session: false}),
    upload.single("file"),
    efilesController.upload
  );
  router.get(
    "/api/file/thumb/full/:file_id/", passport.authenticate('jwt', {session: false}),
    efilesController.getImageByStyle
  );

  //listcallfiles routers
  router.post("/api/listcallfile/find/:params?", passport.authenticate('jwt', {session: false}), listcallfilesController.find);
  router.get(
    "/api/listcallfile/findById/:entity_id", passport.authenticate('jwt', {session: false}),
    listcallfilesController.findById
  );
  router.put("/api/listcallfile/update", passport.authenticate('jwt', {session: false}), listcallfilesController.update);
  router.delete(
    "/api/listcallfile/delete/:params", passport.authenticate('jwt', {session: false}),
    listcallfilesController.delete
  );
  router.post("/api/listcallfile/save", passport.authenticate('jwt', {session: false}), listcallfilesController.save);

    //truncks routers
    router.post("/api/trunck/find/:params?", truncksController.find);
    router.get("/api/trunck/findById/:entity_id", truncksController.findById);
    router.put("/api/trunck/update", truncksController.update);
    router.delete("/api/trunck/delete/:params", truncksController.delete);
    router.post("/api/trunck/save", truncksController.save);

  return router;
};
module.exports = apiRouters;
