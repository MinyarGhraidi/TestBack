const express = require("express");
var axios = require("axios").default
const router = express.Router();

const config = {
  headers: { Authorization: "Bearer U0wglx83RzOBnkb755i8MpZtsuEjna1M7D042fihMXwJs4Tj8uhnsGuK9cIi2IY5" }
};

// to fix SSL certifcate Problem
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

let apiServices = function () {

    //Agents
    router.get("/apicallcenter/agents", (req, res, next) => {
           axios
            .get('https://occ.oxilog.net:2443/api/v1/agents', config)
            .then(resp => res.json(resp.data.result))
            .catch(err => res.json(err))
    
    })





    return router
}

module.exports = apiServices