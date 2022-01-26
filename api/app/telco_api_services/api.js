const express = require("express");
var axios = require("axios").default
const router = express.Router();
const call_center_token = require(__dirname + '/../config/config.json')["call_center_token"];
const dialer_token = require(__dirname + '/../config/config.json')["dialer_token"];
const base_url_cc_kam = require(__dirname + '/../config/config.json')["base_url_cc_kam"];
const base_url_truncks = require(__dirname + '/../config/config.json')["base_url_truncks"];
const base_url_cc_fs = require(__dirname + '/../config/config.json')["base_url_cc_fs"];

const call_center_authorization = {
  headers: { Authorization: call_center_token }
};
const dialer_authorization = {
  headers: { Authorization: dialer_token }
};

// to fix SSL certifcate Problem
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;

let apiServices = function () {

// **** Agents ****
      //find all
    router.get("/apicallcenter/agents", (req, res, next) => {
           axios
            .get(`${base_url_cc_kam}api/v1/agents`, call_center_authorization)
            .then(resp => res.json(resp.data.result))
            .catch(err => res.json(err))
    })
          //find by UUID
    router.get("/apicallcenter/agents/:id", (req, res, next) => {
        let id = req.params.id;
           axios
            .get(`${base_url_cc_kam}api/v1/agents/${id}`, call_center_authorization)
            .then(resp => res.json(resp.data.result))
            .catch(err => res.json(err))
    })
          //create new item
    router.post("/apicallcenter/agents", (req, res, next) => {
           axios
            .post(`${base_url_cc_kam}api/v1/agents`, req.body, call_center_authorization)
            .then(resp => {
                res.json(resp.data.result);
            })
            .catch(err => res.json(err))
    })
          //modify item
    router.put("/apicallcenter/agents/:id", (req, res, next) => {
        let id = req.params.id;
           axios
            .put(`${base_url_cc_kam}api/v1/agents/${id}`, req.body, call_center_authorization)
            .then(resp => res.json(resp.data))
            .catch(err => res.json(err))
    })
          //delete item
    router.delete("/apicallcenter/agents/:id", (req, res, next) => {
        let id = req.params.id;
           axios
            .delete(`${base_url_cc_kam}api/v1/agents/${id}`, call_center_authorization)
            .then(resp => res.json(resp.data))
            .catch(err => res.json(err))
    })

// **** Truncks ****

      //find all
      router.get("/apicallcenter/truncks", (req, res, next) => {
        axios
         .get(`${base_url_cc_kam}api/v1/gateways`, call_center_authorization)
         .then(resp => res.json(resp.data.result))
         .catch(err => res.json(err))
 })
       //find by UUID
 router.get("/apicallcenter/truncks/:id", (req, res, next) => {
     let id = req.params.id;
        axios
         .get(`${base_url_cc_kam}api/v1/gateways/${id}`, call_center_authorization)
         .then(resp => res.json(resp.data.result))
         .catch(err => res.json(err))
 })
       //create new item
 router.post("/apicallcenter/truncks", (req, res, next) => {
     let trunk_kam = req.body;
        axios
         .post(`${base_url_cc_kam}api/v1/gateways`, trunk_kam, call_center_authorization)
         .then(resp => {
             res.json(resp.data.result);
         })
         .catch(err => res.json(err))
 })
       //modify item
 router.put("/apicallcenter/truncks/:id", (req, res, next) => {
     let id = req.params.id;
        axios
         .put(`${base_url_cc_kam}api/v1/gateways/${id}`, req.body, call_center_authorization)
         .then(resp => res.json(resp.data))
         .catch(err => res.json(err))
 })
       //delete item
 router.delete("/apicallcenter/truncks/:id", (req, res, next) => {
     let id = req.params.id;
        axios
         .delete(`${base_url_cc_kam}api/v1/gateways/${id}`, call_center_authorization)
         .then(resp => res.json(resp.data))
         .catch(err => res.json(err))
        })

// **** QUEUES ****

      //find all
      router.get("/apicallcenter/queues", (req, res, next) => {
        axios
         .get(`${base_url_cc_kam}api/v1/queues`, call_center_authorization)
         .then(resp => res.json(resp.data.result))
         .catch(err => res.json(err))
 })
       //find by UUID
 router.get("/apicallcenter/queues/:id", (req, res, next) => {
     let id = req.params.id;
        axios
         .get(`${base_url_cc_kam}api/v1/queues/${id}`, call_center_authorization)
         .then(resp => res.json(resp.data.result))
         .catch(err => res.json(err))
 })
       //create new item
 router.post("/apicallcenter/queues", (req, res, next) => {
        axios
         .post(`${base_url_cc_kam}api/v1/queues`, req.body, call_center_authorization)
         .then(resp => {
             res.json(resp.data);
         })
         .catch(err => res.json(err))
 })
       //modify item
 router.put("/apicallcenter/queues/:id", (req, res, next) => {
     let id = req.params.id;
        axios
         .put(`${base_url_cc_kam}api/v1/queues/${id}`, req.body, call_center_authorization)
         .then(resp => res.json(resp.data))
         .catch(err => res.json(err))
 })
       //delete item
 router.delete("/apicallcenter/queues/:id", (req, res, next) => {
     let id = req.params.id;
        axios
         .delete(`${base_url_cc_kam}api/v1/queues/${id}`, call_center_authorization)
         .then(resp => res.json(resp.data))
         .catch(err => res.json(err))
 })
       //add agent to queue 
 router.post("/apicallcenter/queues/:id/tiers", (req, res, next) => {
     let id = req.params.id;
        axios
         .post(`${base_url_cc_kam}api/v1/queues/${id}/tiers`, req.body, call_center_authorization)
         .then(resp => res.json(resp.data))
         .catch(err => res.json(err))
 })
       //delete agent from queue 
 router.post("/apicallcenter/queues/:id/tiers/delete", (req, res, next) => {
     let id = req.params.id;
        axios
         .post(`${base_url_cc_kam}api/v1/queues/${id}/tiers/delete`, req.body, call_center_authorization)
         .then(resp => res.json(resp.data))
         .catch(err => res.json(err))
 })

 // **** acl_groups ****

      //find all
      router.get("/apicallcenter/acl_groups", (req, res, next) => {
            axios
             .get(`${base_url_cc_fs}api/v1/acl_groups`, call_center_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //find by UUID
     router.get("/apicallcenter/acl_groups/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .get(`${base_url_cc_fs}api/v1/acl_groups/${id}`, call_center_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //create new item
     router.post("/apicallcenter/acl_groups", (req, res, next) => {
            axios
             .post(`${base_url_cc_fs}api/v1/acl_groups`, req.body, call_center_authorization)
             .then(resp => {
                 res.json(resp.data.result);
             })
             .catch(err => res.json(err))
     })
           //modify item
     router.put("/apicallcenter/acl_groups/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .put(`${base_url_cc_fs}api/v1/acl_groups/${id}`, req.body, call_center_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })
           //delete item
     router.delete("/apicallcenter/acl_groups/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .delete(`${base_url_cc_fs}api/v1/acl_groups/${id}`, call_center_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })

 // **** dispatcher ****

      //find all
      router.get("/apicallcenter/dispatcher", (req, res, next) => {
            axios
             .get(`${base_url_cc_fs}api/v1/dispatcher`, call_center_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //find by UUID
     router.get("/apicallcenter/dispatcher/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .get(`${base_url_cc_fs}api/v1/dispatcher/${id}`, call_center_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //create new item
     router.post("/apicallcenter/dispatcher", (req, res, next) => {
            axios
             .post(`${base_url_cc_fs}api/v1/dispatcher`, req.body, call_center_authorization)
             .then(resp => {
                 res.json(resp.data);
             })
             .catch(err => res.json(err))
     })
           //modify item
     router.put("/apicallcenter/dispatcher/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .put(`${base_url_cc_fs}api/v1/dispatcher/${id}`, req.body, call_center_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })
           //delete item
     router.delete("/apicallcenter/dispatcher/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .delete(`${base_url_cc_fs}api/v1/dispatcher/${id}`, call_center_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })



 // **** domains ****

      //find all
      router.get("/apicallcenter/domains", (req, res, next) => {
            axios
             .get(`${base_url_cc_fs}api/v1/domains`, call_center_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //find by UUID
     router.get("/apicallcenter/domains/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .get(`${base_url_cc_fs}api/v1/domains/${id}`, call_center_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //create new item
     router.post("/apicallcenter/domains", (req, res, next) => {
            axios
             .post(`${base_url_cc_fs}api/v1/domains`, req.body, call_center_authorization)
             .then(resp => {
                 res.json(resp.data);
             })
             .catch(err => res.json(err))
     })
           //modify item
     router.put("/apicallcenter/domains/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .put(`${base_url_cc_fs}api/v1/domains/${id}`, req.body, call_center_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })
           //delete item
     router.delete("/apicallcenter/domains/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .delete(`${base_url_cc_fs}api/v1/domains/${id}`, call_center_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })


 // **** rtpengine ****

      //find all
      router.get("/apicallcenter/rtpengine", (req, res, next) => {
            axios
             .get(`${base_url_cc_fs}api/v1/rtpengine`, call_center_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //find by UUID
     router.get("/apicallcenter/rtpengine/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .get(`${base_url_cc_fs}api/v1/rtpengine/${id}`, call_center_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //create new item
     router.post("/apicallcenter/rtpengine", (req, res, next) => {
            axios
             .post(`${base_url_cc_fs}api/v1/rtpengine`, req.body, call_center_authorization)
             .then(resp => {
                 res.json(resp.data);
             })
             .catch(err => res.json(err))
     })
           //modify item
     router.put("/apicallcenter/rtpengine/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .put(`${base_url_cc_fs}api/v1/rtpengine/${id}`, req.body, call_center_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })
           //delete item
     router.delete("/apicallcenter/rtpengine/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .delete(`${base_url_cc_fs}api/v1/rtpengine/${id}`, call_center_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })



 // **** servers ****

      //find all
      router.get("/apicallcenter/servers", (req, res, next) => {
            axios
             .get(`${base_url_cc_kam}api/v1/servers`, call_center_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //find by UUID
     router.get("/apicallcenter/servers/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .get(`${base_url_cc_kam}api/v1/servers/${id}`, call_center_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //create new item
     router.post("/apicallcenter/servers", (req, res, next) => {
            axios
             .post(`${base_url_cc_kam}api/v1/servers`, req.body, call_center_authorization)
             .then(resp => {
                 res.json(resp.data);
             })
             .catch(err => res.json(err))
     })
           //modify item
     router.put("/apicallcenter/servers/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .put(`${base_url_cc_kam}api/v1/servers/${id}`, req.body, call_center_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })
           //delete item
     router.delete("/apicallcenter/servers/:id", (req, res, next) => {
         let id = req.params.id;
            axios
             .delete(`${base_url_cc_kam}api/v1/servers/${id}`, call_center_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })


    return router
}

module.exports = apiServices