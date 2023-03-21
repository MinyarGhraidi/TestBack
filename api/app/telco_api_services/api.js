const express = require("express");
let axios = require("axios").default
const router = express.Router();
const call_center_token = require(__dirname + '/../config/config.json')["call_center_token"];
const base_url_cc_kam = require(__dirname + '/../config/config.json')["base_url_cc_kam"];
const base_url_cc_fs = require(__dirname + '/../config/config.json')["base_url_cc_fs"];

const call_center_authorization = {
  headers: { Authorization: call_center_token }
};

// to fix SSL certifcate Problem
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

let apiServices = function (passport) {

 // **** acl_groups ****

      //find all
      router.get("/apicallcenter/acl_groups", passport.authenticate('jwt', {session: false}), (req, res, next) => {
            axios
             .get(`${base_url_cc_fs}api/v1/acl_groups`, call_center_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //find by UUID
     router.get("/apicallcenter/acl_groups/:id", passport.authenticate('jwt', {session: false}),(req, res, next) => {
         let id = req.params.id;
            axios
             .get(`${base_url_cc_fs}api/v1/acl_groups/${id}`, call_center_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //create new item
     router.post("/apicallcenter/acl_groups", passport.authenticate('jwt', {session: false}), (req, res, next) => {
            axios
             .post(`${base_url_cc_fs}api/v1/acl_groups`, req.body, call_center_authorization)
             .then(resp => {
                 res.json(resp.data.result);
             })
             .catch(err => res.json(err))
     })
           //modify item
     router.put("/apicallcenter/acl_groups/:id", passport.authenticate('jwt', {session: false}), (req, res, next) => {
         let id = req.params.id;
            axios
             .put(`${base_url_cc_fs}api/v1/acl_groups/${id}`, req.body, call_center_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })
           //delete item
     router.delete("/apicallcenter/acl_groups/:id", passport.authenticate('jwt', {session: false}), (req, res, next) => {
         let id = req.params.id;
            axios
             .delete(`${base_url_cc_fs}api/v1/acl_groups/${id}`, call_center_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })

 // **** dispatcher ****

      //find all
      router.get("/apicallcenter/dispatcher", passport.authenticate('jwt', {session: false}), (req, res, next) => {
            axios
             .get(`${base_url_cc_fs}api/v1/dispatcher`, call_center_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //find by UUID
     router.get("/apicallcenter/dispatcher/:id", passport.authenticate('jwt', {session: false}), (req, res, next) => {
         let id = req.params.id;
            axios
             .get(`${base_url_cc_fs}api/v1/dispatcher/${id}`, call_center_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //create new item
     router.post("/apicallcenter/dispatcher", passport.authenticate('jwt', {session: false}), (req, res, next) => {
            axios
             .post(`${base_url_cc_fs}api/v1/dispatcher`, req.body, call_center_authorization)
             .then(resp => {
                 res.json(resp.data);
             })
             .catch(err => res.json(err))
     })
           //modify item
     router.put("/apicallcenter/dispatcher/:id", passport.authenticate('jwt', {session: false}), (req, res, next) => {
         let id = req.params.id;
            axios
             .put(`${base_url_cc_fs}api/v1/dispatcher/${id}`, req.body, call_center_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })
           //delete item
     router.delete("/apicallcenter/dispatcher/:id", passport.authenticate('jwt', {session: false}), (req, res, next) => {
         let id = req.params.id;
            axios
             .delete(`${base_url_cc_fs}api/v1/dispatcher/${id}`, call_center_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })



 // **** domains ****

      //find all
      router.get("/apicallcenter/domains", passport.authenticate('jwt', {session: false}), (req, res, next) => {
            axios
             .get(`${base_url_cc_fs}api/v1/domains`, call_center_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //find by UUID
     router.get("/apicallcenter/domains/:id", passport.authenticate('jwt', {session: false}), (req, res, next) => {
         let id = req.params.id;
            axios
             .get(`${base_url_cc_fs}api/v1/domains/${id}`, call_center_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //create new item
     router.post("/apicallcenter/domains", passport.authenticate('jwt', {session: false}), (req, res, next) => {
            axios
             .post(`${base_url_cc_fs}api/v1/domains`, req.body, call_center_authorization)
             .then(resp => {
                 res.json(resp.data);
             })
             .catch(err => res.json(err))
     })
           //modify item
     router.put("/apicallcenter/domains/:id", passport.authenticate('jwt', {session: false}), (req, res, next) => {
         let id = req.params.id;
            axios
             .put(`${base_url_cc_fs}api/v1/domains/${id}`, req.body, call_center_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })
           //delete item
     router.delete("/apicallcenter/domains/:id", passport.authenticate('jwt', {session: false}), (req, res, next) => {
         let id = req.params.id;
            axios
             .delete(`${base_url_cc_fs}api/v1/domains/${id}`, call_center_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })


 // **** rtpengine ****

      //find all
      router.get("/apicallcenter/rtpengine", passport.authenticate('jwt', {session: false}), (req, res, next) => {
            axios
             .get(`${base_url_cc_fs}api/v1/rtpengine`, call_center_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //find by UUID
     router.get("/apicallcenter/rtpengine/:id", passport.authenticate('jwt', {session: false}), (req, res, next) => {
         let id = req.params.id;
            axios
             .get(`${base_url_cc_fs}api/v1/rtpengine/${id}`, call_center_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //create new item
     router.post("/apicallcenter/rtpengine", passport.authenticate('jwt', {session: false}), (req, res, next) => {
            axios
             .post(`${base_url_cc_fs}api/v1/rtpengine`, req.body, call_center_authorization)
             .then(resp => {
                 res.json(resp.data);
             })
             .catch(err => res.json(err))
     })
           //modify item
     router.put("/apicallcenter/rtpengine/:id", passport.authenticate('jwt', {session: false}), (req, res, next) => {
         let id = req.params.id;
            axios
             .put(`${base_url_cc_fs}api/v1/rtpengine/${id}`, req.body, call_center_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })
           //delete item
     router.delete("/apicallcenter/rtpengine/:id", passport.authenticate('jwt', {session: false}), (req, res, next) => {
         let id = req.params.id;
            axios
             .delete(`${base_url_cc_fs}api/v1/rtpengine/${id}`, call_center_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })



 // **** servers ****

      //find all
      router.get("/apicallcenter/servers", passport.authenticate('jwt', {session: false}), (req, res, next) => {
            axios
             .get(`${base_url_cc_kam}api/v1/servers`, call_center_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //find by UUID
     router.get("/apicallcenter/servers/:id", passport.authenticate('jwt', {session: false}), (req, res, next) => {
         let id = req.params.id;
            axios
             .get(`${base_url_cc_kam}api/v1/servers/${id}`, call_center_authorization)
             .then(resp => res.json(resp.data.result))
             .catch(err => res.json(err))
     })
           //create new item
     router.post("/apicallcenter/servers", passport.authenticate('jwt', {session: false}), (req, res, next) => {
            axios
             .post(`${base_url_cc_kam}api/v1/servers`, req.body, call_center_authorization)
             .then(resp => {
                 res.json(resp.data);
             })
             .catch(err => res.json(err))
     })
           //modify item
     router.put("/apicallcenter/servers/:id", passport.authenticate('jwt', {session: false}), (req, res, next) => {
         let id = req.params.id;
            axios
             .put(`${base_url_cc_kam}api/v1/servers/${id}`, req.body, call_center_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })
           //delete item
     router.delete("/apicallcenter/servers/:id", passport.authenticate('jwt', {session: false}), (req, res, next) => {
         let id = req.params.id;
            axios
             .delete(`${base_url_cc_kam}api/v1/servers/${id}`, call_center_authorization)
             .then(resp => res.json(resp.data))
             .catch(err => res.json(err))
     })


    return router
}

module.exports = apiServices
