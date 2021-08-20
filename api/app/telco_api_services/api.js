const express = require("express");
var axios = require("axios").default
const router = express.Router();
const agent_token = require(__dirname + '/../config/config.json')["agent_token"];
const trunck_token = require(__dirname + '/../config/config.json')["trunck_token"];
const base_url_agents = require(__dirname + '/../config/config.json')["base_url_agents"];
const base_url_truncks = require(__dirname + '/../config/config.json')["base_url_truncks"];
const base_url_queues = require(__dirname + '/../config/config.json')["base_url_queues"];
const base_url_rest_api = require(__dirname + '/../config/config.json')["base_url_rest_api"];
const base_url_server = require(__dirname + '/../config/config.json')["base_url_server"];

const agents_authorization = {
  headers: { Authorization: agent_token }
};
const truncks_authorization = {
  headers: { Authorization: trunck_token }
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
         .get(`${base_url_queues}api/v1/queues`, agents_authorization)
         .then(resp => res.json(resp.data.result))
         .catch(err => res.json(err))
 })
       //find by UUID
 router.get("/apicallcenter/queues/:id", (req, res, next) => {
     let id = req.params.id;
        axios
         .get(`${base_url_queues}api/v1/queues/${id}`, agents_authorization)
         .then(resp => res.json(resp.data.result))
         .catch(err => res.json(err))
 })
       //create new item
 router.post("/apicallcenter/queues", (req, res, next) => {
        axios
         .post(`${base_url_queues}api/v1/queues`, req.body, agents_authorization)
         .then(resp => {
             res.json(resp.data);
         })
         .catch(err => res.json(err))
 })
       //modify item
 router.put("/apicallcenter/queues/:id", (req, res, next) => {
     let id = req.params.id;
        axios
         .put(`${base_url_queues}api/v1/queues/${id}`, req.body, agents_authorization)
         .then(resp => res.json(resp.data))
         .catch(err => res.json(err))
 })
       //delete item
 router.delete("/apicallcenter/queues/:id", (req, res, next) => {
     let id = req.params.id;
        axios
         .delete(`${base_url_queues}api/v1/queues/${id}`, agents_authorization)
         .then(resp => res.json(resp.data))
         .catch(err => res.json(err))
 })

 // **** acl_groups ****

      //find all
      router.get("/apicallcenter/acl_groups", (req, res, next) => {
            axios
             .get(`${base_url_rest_api}api/v1/acl_groups`, agents_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //find by UUID
     router.get("/apicallcenter/acl_groups/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .get(`${base_url_rest_api}api/v1/acl_groups/${id}`, agents_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //create new item
     router.post("/apicallcenter/acl_groups", (req, res, next) => {
            axios
             .post(`${base_url_rest_api}api/v1/acl_groups`, req.body, agents_authorization)
             .then(resp => {
                 res.json(resp.data.result);
             })
             .catch(err => res.json(err))
     })
           //modify item
     router.put("/apicallcenter/acl_groups/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .put(`${base_url_rest_api}api/v1/acl_groups/${id}`, req.body, agents_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })
           //delete item
     router.delete("/apicallcenter/acl_groups/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .delete(`${base_url_rest_api}api/v1/acl_groups/${id}`, agents_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })

 // **** dispatcher ****

      //find all
      router.get("/apicallcenter/dispatcher", (req, res, next) => {
            axios
             .get(`${base_url_rest_api}api/v1/dispatcher`, agents_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //find by UUID
     router.get("/apicallcenter/dispatcher/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .get(`${base_url_rest_api}api/v1/dispatcher/${id}`, agents_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //create new item
     router.post("/apicallcenter/dispatcher", (req, res, next) => {
            axios
             .post(`${base_url_rest_api}api/v1/dispatcher`, req.body, agents_authorization)
             .then(resp => {
                 res.json(resp.data);
             })
             .catch(err => res.json(err))
     })
           //modify item
     router.put("/apicallcenter/dispatcher/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .put(`${base_url_rest_api}api/v1/dispatcher/${id}`, req.body, agents_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })
           //delete item
     router.delete("/apicallcenter/dispatcher/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .delete(`${base_url_rest_api}api/v1/dispatcher/${id}`, agents_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })



 // **** domains ****

      //find all
      router.get("/apicallcenter/domains", (req, res, next) => {
            axios
             .get(`${base_url_rest_api}api/v1/domains`, agents_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //find by UUID
     router.get("/apicallcenter/domains/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .get(`${base_url_rest_api}api/v1/domains/${id}`, agents_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //create new item
     router.post("/apicallcenter/domains", (req, res, next) => {
            axios
             .post(`${base_url_rest_api}api/v1/domains`, req.body, agents_authorization)
             .then(resp => {
                 res.json(resp.data);
             })
             .catch(err => res.json(err))
     })
           //modify item
     router.put("/apicallcenter/domains/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .put(`${base_url_rest_api}api/v1/domains/${id}`, req.body, agents_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })
           //delete item
     router.delete("/apicallcenter/domains/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .delete(`${base_url_rest_api}api/v1/domains/${id}`, agents_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })


 // **** rtpengine ****

      //find all
      router.get("/apicallcenter/rtpengine", (req, res, next) => {
            axios
             .get(`${base_url_rest_api}api/v1/rtpengine`, agents_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //find by UUID
     router.get("/apicallcenter/rtpengine/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .get(`${base_url_rest_api}api/v1/rtpengine/${id}`, agents_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //create new item
     router.post("/apicallcenter/rtpengine", (req, res, next) => {
            axios
             .post(`${base_url_rest_api}api/v1/rtpengine`, req.body, agents_authorization)
             .then(resp => {
                 res.json(resp.data);
             })
             .catch(err => res.json(err))
     })
           //modify item
     router.put("/apicallcenter/rtpengine/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .put(`${base_url_rest_api}api/v1/rtpengine/${id}`, req.body, agents_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })
           //delete item
     router.delete("/apicallcenter/rtpengine/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .delete(`${base_url_rest_api}api/v1/rtpengine/${id}`, agents_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })



 // **** servers ****

      //find all
      router.get("/apicallcenter/servers", (req, res, next) => {
            axios
             .get(`${base_url_server}api/v1/servers`, agents_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //find by UUID
     router.get("/apicallcenter/servers/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .get(`${base_url_server}api/v1/servers/${id}`, agents_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //create new item
     router.post("/apicallcenter/servers", (req, res, next) => {
            axios
             .post(`${base_url_server}api/v1/servers`, req.body, agents_authorization)
             .then(resp => {
                 res.json(resp.data);
             })
             .catch(err => res.json(err))
     })
           //modify item
     router.put("/apicallcenter/servers/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .put(`${base_url_server}api/v1/servers/${id}`, req.body, agents_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })
           //delete item
     router.delete("/apicallcenter/servers/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .delete(`${base_url_server}api/v1/servers/${id}`, agents_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })


    return router
}

module.exports = apiServices