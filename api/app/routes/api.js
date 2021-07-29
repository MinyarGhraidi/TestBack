let router = require('express').Router(),
    accountController = require('../controllers/account.controller')
    lookupController = require('../controllers/lookups.controller')
    utilityController = require('../controllers/utility.controller')
    campaignController = require('../controllers/campaign.controller')
    rolesController = require('../controllers/roles.controller')
    usersController = require('../controllers/users.controller')
    agentsController = require('../controllers/agents.controller')
    efilesController = require('../controllers/efiles.controller')
    listcallfilesController = require('../controllers/listcallfiles.controller')

//                         ====> don't forget to re-add : passport.authenticate('jwt', {session: false}) <=====

    let apiRouters = function (passport) {

        // Generic routers
        router.get('/api/generateTokenForUser',utilityController.generateTokenForUser);

        // account routers
        router.post('/api/account/find', accountController.find);
        router.get('/api/account/findById/:entity_id', accountController.findById);
        router.put('/api/account/update', accountController.update);
        router.delete('/api/account/delete/:params',  accountController.delete);
        router.post('/api/account/save', accountController.save);

        router.post('/api/account/signin', accountController.signIn);
        router.post('/api/account/getAccountByToken', passport.authenticate('jwt', {session: false}),accountController.getAccountByToken);
       
        // campaigns routers 
        router.post('/api/campaign/find', campaignController.find);
        router.get('/api/campaign/findById/:entity_id',  campaignController.findById);
        router.put('/api/campaign/update',  campaignController.update);
        router.delete('/api/campaign/delete/:params',  campaignController.delete);
        router.post('/api/campaign/save',  campaignController.save);

        
        //role routers
        router.post('/api/role/find/:params?', rolesController.find);
        router.get('/api/role/findById/:entity_id', rolesController.findById);
        router.put('/api/role/update', rolesController.update);
        router.delete('/api/role/delete/:params',  rolesController.delete);
        router.post('/api/role/save',  rolesController.save);

        //user routers
         router.post('/api/user/find/:params?', usersController.find);
         router.get('/api/user/findById/:entity_id', usersController.findById);
         router.put('/api/user/update', usersController.update);
         router.delete('/api/user/delete/:params', usersController.delete);
         router.post('/api/user/save', usersController.save);

         router.post('/api/user/signin', usersController.signIn);
         router.post('/api/user/getUserByToken', passport.authenticate('jwt', {session: false}),usersController.getUserByToken);
        
         router.post('/api/signup', usersController.signUp);
         router.post('/api/signin', usersController.signIn);

        //agents routers
         router.post('/api/agent/find/:params?', agentsController.find);
         router.get('/api/agent/findById/:entity_id', agentsController.findById);
         router.put('/api/agent/update', agentsController.update);
         router.delete('/api/agent/delete/:params', agentsController.delete);
         router.post('/api/agent/save', agentsController.save);
        
         router.post('/api/signup', agentsController.signUp);
         router.post('/api/signin', agentsController.signIn);

         //Lookups 

           // account routers
        router.post('/api/lookup/find', passport.authenticate('jwt', {session: false}),lookupController.find);
        router.get('/api/lookup/findById/:entity_id', passport.authenticate('jwt', {session: false}), lookupController.findById);
        router.put('/api/lookup/update', passport.authenticate('jwt', {session: false}), lookupController.update);
        router.delete('/api/lookup/delete/:params', passport.authenticate('jwt', {session: false}), lookupController.delete);
        router.post('/api/lookup/save', passport.authenticate('jwt', {session: false}), lookupController.save);

        return router;
}
module.exports = apiRouters;
