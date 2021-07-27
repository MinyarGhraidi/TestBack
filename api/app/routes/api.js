let router = require('express').Router(),
    accountController = require('../controllers/account.controller')
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


        //efiles routers
         router.post('/api/efile/find/:params?', efilesController.find);
         router.get('/api/efile/findById/:entity_id', efilesController.findById);
         router.put('/api/efile/update', efilesController.update);
         router.delete('/api/efile/delete/:params', efilesController.delete);
         router.post('/api/efile/save', efilesController.save);

        //listcallfiles routers
         router.post('/api/listcallfile/find/:params?', listcallfilesController.find);
         router.get('/api/listcallfile/findById/:entity_id', listcallfilesController.findById);
         router.put('/api/listcallfile/update', listcallfilesController.update);
         router.delete('/api/listcallfile/delete/:params', listcallfilesController.delete);
         router.post('/api/listcallfile/save', listcallfilesController.save);
        


        return router;
}
module.exports = apiRouters;
