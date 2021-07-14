
const { appSecret} = require("../helpers/app");
const jwt = require('jsonwebtoken');


class utilitiesbo  {
    generateTokenForUser(req, res, next) {
        let data = {...{
            }};

        res.send({
            success: true,
            jwt: jwt.sign(data, appSecret, {
                expiresIn: '8600m',
            })
        })
    }
}

module.exports = utilitiesbo;
