const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const db = require('../models');
const config = require('../config/config.json');

const hookJWTStrategy = (passport) => {
    let options = {};
    options.secretOrKey = config.secret;
    options.jwtFromRequest = ExtractJwt.fromExtractors([
        ExtractJwt.fromUrlQueryParameter("token"),
        ExtractJwt.fromHeader("token"),
        ExtractJwt.fromAuthHeaderAsBearerToken()
    ]);
    options.ignoreExpiration = false;

    passport.use(new JWTStrategy(options, (JWTPayload, callback) => {
        callback(null, JWTPayload);
        return
        db.users.findOne({ where: { user_email: JWTPayload.user_email } })
            .then((user) => {
                if (!user) {
                    return callback(null, false);
                }
                callback(null, user);
            }).catch((error) => {
                res.sendStatus(403);
            });
    }));
}

module.exports = hookJWTStrategy;
