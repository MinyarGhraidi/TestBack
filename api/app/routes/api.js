// const rolesController = require('../controllers/roles.controller');

let router = require('express').Router(),
    accountController = require('../controllers/account.controller')
    utilityController = require('../controllers/utility.controller')
    rategroupController = require('../controllers/rategroup.controller')
    paymentController = require('../controllers/payment.controller')

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




        return router;
}
module.exports = apiRouters;
