const express = require("express");
var axios = require("axios").default
const router = express.Router();
const agent_token = require(__dirname + '/../config/config.json')["agent_token"];
const base_url = require(__dirname + '/../config/config.json')["base_url"];

const authorization = {
  headers: { Authorization: agent_token }
};

// to fix SSL certifcate Problem
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

let apiServices = function () {

    //Agents
    router.get("/apicallcenter/agents", (req, res, next) => {
           axios
            .get(`${base_url}api/v1/agents`, authorization)
            .then(resp => res.json(resp.data.result))
            .catch(err => res.json(err))
    })
    router.get("/apicallcenter/agents/:id", (req, res, next) => {
        let id = req.params.id;
           axios
            .get(`${base_url}api/v1/agents/${id}`, authorization)
            .then(resp => res.json(resp.data.result))
            .catch(err => res.json(err))
    })
    router.post("/apicallcenter/agents", (req, res, next) => {
           axios
            .post(`${base_url}api/v1/agents`, req.body, authorization)
            .then(resp => {
                console.log('****',resp.data.result);
                res.json(resp.data.result);
            })
            .catch(err => res.json(err))
    })
    router.put("/apicallcenter/agents/:id", (req, res, next) => {
        let id = req.params.id;
           axios
            .put(`${base_url}api/v1/agents/${id}`, req.body, authorization)
            .then(resp => res.json(resp.data))
            .catch(err => res.json(err))
    })
    router.delete("/apicallcenter/agents/:id", (req, res, next) => {
        let id = req.params.id;
           axios
            .delete(`${base_url}api/v1/agents/${id}`, authorization)
            .then(resp => res.json(resp.data))
            .catch(err => res.json(err))
    })





    return router
}

module.exports = apiServices