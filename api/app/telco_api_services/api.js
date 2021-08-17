const express = require("express");
var axios = require("axios").default
const router = express.Router();
const agent_token = require(__dirname + '/../config/config.json')["agent_token"];
const trunck_token = require(__dirname + '/../config/config.json')["trunck_token"];
const queue_token = require(__dirname + '/../config/config.json')["queue_token"];
const base_url_agents = require(__dirname + '/../config/config.json')["base_url_agents"];
const base_url_truncks = require(__dirname + '/../config/config.json')["base_url_truncks"];
const base_url_queues = require(__dirname + '/../config/config.json')["base_url_queues"];

const agents_authorization = {
  headers: { Authorization: agent_token }
};
const truncks_authorization = {
  headers: { Authorization: trunck_token }
};
const queues_authorization = {
  headers: { Authorization: queue_token }
};

// to fix SSL certifcate Problem
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

let apiServices = function () {

// **** Agents ****
      //find all
    router.get("/apicallcenter/agents", (req, res, next) => {
           axios
            .get(`${base_url_agents}api/v1/agents`, agents_authorization)
            .then(resp => res.json(resp.data.result))
            .catch(err => res.json(err))
    })
          //find by UUID
    router.get("/apicallcenter/agents/:id", (req, res, next) => {
        let id = req.params.id;
           axios
            .get(`${base_url_agents}api/v1/agents/${id}`, agents_authorization)
            .then(resp => res.json(resp.data.result))
            .catch(err => res.json(err))
    })
          //create new item
    router.post("/apicallcenter/agents", (req, res, next) => {
           axios
            .post(`${base_url_agents}api/v1/agents`, req.body, agents_authorization)
            .then(resp => {
                res.json(resp.data.result);
            })
            .catch(err => res.json(err))
    })
          //modify item
    router.put("/apicallcenter/agents/:id", (req, res, next) => {
        let id = req.params.id;
           axios
            .put(`${base_url_agents}api/v1/agents/${id}`, req.body, agents_authorization)
            .then(resp => res.json(resp.data))
            .catch(err => res.json(err))
    })
          //delete item
    router.delete("/apicallcenter/agents/:id", (req, res, next) => {
        let id = req.params.id;
           axios
            .delete(`${base_url_agents}api/v1/agents/${id}`, agents_authorization)
            .then(resp => res.json(resp.data))
            .catch(err => res.json(err))
    })

// **** Truncks ****

      //find all
      router.get("/apicallcenter/truncks", (req, res, next) => {
        axios
         .get(`${base_url_truncks}api/v1/dialer/gateways`, truncks_authorization)
         .then(resp => res.json(resp.data.result))
         .catch(err => res.json(err))
 })
       //find by UUID
 router.get("/apicallcenter/truncks/:id", (req, res, next) => {
     let id = req.params.id;
        axios
         .get(`${base_url_truncks}api/v1/dialer/gateways/${id}`, truncks_authorization)
         .then(resp => res.json(resp.data.result))
         .catch(err => res.json(err))
 })
       //create new item
 router.post("/apicallcenter/truncks", (req, res, next) => {
        axios
         .post(`${base_url_truncks}api/v1/dialer/gateways`, req.body, truncks_authorization)
         .then(resp => {
             res.json(resp.data.result);
         })
         .catch(err => res.json(err))
 })
       //modify item
 router.put("/apicallcenter/truncks/:id", (req, res, next) => {
     let id = req.params.id;
        axios
         .put(`${base_url_truncks}api/v1/dialer/gateways/${id}`, req.body, truncks_authorization)
         .then(resp => res.json(resp.data))
         .catch(err => res.json(err))
 })
       //delete item
 router.delete("/apicallcenter/truncks/:id", (req, res, next) => {
     let id = req.params.id;
        axios
         .delete(`${base_url_truncks}api/v1/dialer/gateways/${id}`, truncks_authorization)
         .then(resp => res.json(resp.data))
         .catch(err => res.json(err))
        })

// **** QUEUES ****

      //find all
      router.get("/apicallcenter/queues", (req, res, next) => {
        axios
         .get(`${base_url_queues}api/v1/queues`, queues_authorization)
         .then(resp => res.json(resp.data.result))
         .catch(err => res.json(err))
 })
       //find by UUID
 router.get("/apicallcenter/queues/:id", (req, res, next) => {
     let id = req.params.id;
        axios
         .get(`${base_url_queues}api/v1/queues/${id}`, queues_authorization)
         .then(resp => res.json(resp.data.result))
         .catch(err => res.json(err))
 })
       //create new item
 router.post("/apicallcenter/queues", (req, res, next) => {
        axios
         .post(`${base_url_queues}api/v1/queues`, req.body, queues_authorization)
         .then(resp => {
             res.json(resp.data);
         })
         .catch(err => res.json(err))
 })
       //modify item
 router.put("/apicallcenter/queues/:id", (req, res, next) => {
     let id = req.params.id;
        axios
         .put(`${base_url_queues}api/v1/queues/${id}`, req.body, queues_authorization)
         .then(resp => res.json(resp.data))
         .catch(err => res.json(err))
 })
       //delete item
 router.delete("/apicallcenter/queues/:id", (req, res, next) => {
     let id = req.params.id;
        axios
         .delete(`${base_url_queues}api/v1/queues/${id}`, queues_authorization)
         .then(resp => res.json(resp.data))
         .catch(err => res.json(err))
 })


    return router
}

module.exports = apiServices