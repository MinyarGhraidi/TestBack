// const rolesController = require('../controllers/roles.controller');

let router = require('express').Router(),
    accountController = require('../controllers/account.controller')
    utilityController = require('../controllers/utility.controller')
    campaignController = require('../controllers/campaign.controller')
    rolesController = require('../controllers/roles.controller')
    usersController = require('../controllers/users.controller')

    let apiRouters = function (passport) {

        // Generic routers
        router.get('/api/generateTokenForUser',utilityController.generateTokenForUser);

        // account routers
        router.post('/api/account/find', passport.authenticate('jwt', {session: false}),accountController.find);
        router.get('/api/account/findById/:entity_id', passport.authenticate('jwt', {session: false}), accountController.findById);
        router.put('/api/account/update', passport.authenticate('jwt', {session: false}), accountController.update);
        router.delete('/api/account/delete/:params', passport.authenticate('jwt', {session: false}), accountController.delete);
        router.post('/api/account/save', passport.authenticate('jwt', {session: false}), accountController.save);

        router.post('/api/account/signin', accountController.signIn);
        router.post('/api/account/getAccountByToken', passport.authenticate('jwt', {session: false}),accountController.getAccountByToken);
       
        // campaigns routers 
        router.post('/api/campaign/find', campaignController.find);
        router.get('/api/campaign/findById/:entity_id',  campaignController.findById);
        router.put('/api/campaign/update',  campaignController.update);
        router.delete('/api/campaign/delete/:params',  campaignController.delete);
        router.post('/api/campaign/save',  campaignController.save);

        
        //role routers
        router.post('/api/role/find/:params?', passport.authenticate('jwt', {session: false}), rolesController.find);
        router.get('/api/role/findById/:entity_id', passport.authenticate('jwt', {session: false}), rolesController.findById);
        router.put('/api/role/update', passport.authenticate('jwt', {session: false}), rolesController.update);
        router.delete('/api/role/delete/:params', passport.authenticate('jwt', {session: false}), rolesController.delete);
        router.post('/api/role/save', passport.authenticate('jwt', {session: false}), rolesController.save);

        //user routers
         router.post('/api/user/find/:params?', usersController.find);
         router.get('/api/user/findById/:entity_id', usersController.findById);
         router.put('/api/user/update', usersController.update);
         router.delete('/api/user/delete/:params', usersController.delete);
         router.post('/api/user/save', usersController.save);
        
         router.post('/api/signup', usersController.signUp);
         router.post('/api/signin', usersController.signIn);



        return router;
}
module.exports = apiRouters;
