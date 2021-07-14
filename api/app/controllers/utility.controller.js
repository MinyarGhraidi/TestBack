const itembo  = require('../bo/utilitiesbo');
let _itembo = new itembo();


module.exports = {

    generateTokenForUser: function (req, res, next) {
        _itembo.generateTokenForUser(req,res, next)
    }

};