const moment = require('moment');
const jwt = require('jsonwebtoken');
const diff = require("deep-object-diff").diff;
const Sequelize = require('sequelize');
const Op = require("sequelize/lib/operators");
const {default: axios} = require("axios");
const appSocket = new (require('../providers/AppSocket'))();
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];
const call_center_token = require(__dirname + '/../config/config.json')[env]["call_center_token"];
const base_url_cc_kam = require(__dirname + '/../config/config.json')[env]["base_url_cc_kam"];

const call_center_authorization = {
    headers: {Authorization: call_center_token}
};
class baseModelbo {
    request = null;
    response = null;

    constructor(baseModelDao, primaryKey) {
        this.db = require('../models');
        this.baseModal = baseModelDao;
        this.primaryKey = primaryKey;
    }

    sendResponseError(res, messages, err, status = 500) {
        res.status(status).send({
            success: false,
            error: err,
            messages: messages,
        });
    }
    alterFindById(entityData) {
        return new Promise((resolve, reject) => {
            resolve(entityData);
        });
    }
    setRequest(req) {
        this.request = req;
    }
    setResponse(res) {
        this.response = res;
    }
    setRequestParams(params) {
        this.request_params = params;
    }
    findById(req, res, next) {
        this.setRequest(req);
        this.setResponse(res);
        const {entity_id} = req.params;
        this.db[this.baseModal].findById(entity_id)
            .then(result => {
                let whereQuery = {};
                whereQuery[this.primaryKey] = result[this.primaryKey];
                let includesQuery = [];
                if (result.getModelIncludes && result.getModelIncludes()) {
                    result.getModelIncludes().forEach(icludeItem => {
                        if (this.db[icludeItem]) {
                            includesQuery.push({
                                model: this.db[icludeItem],
                                required: false,
                                where: {
                                    active: 'Y'
                                }
                            });
                        }
                    })
                }
                this.db[this.baseModal].find({
                    where: whereQuery,
                    include: includesQuery
                }).then(resFind => {
                    return this.alterFindById(resFind).then(data => {
                        res.json({
                            message: 'success',
                            data: data,
                            status: 1,
                        });
                    });
                })
            }).catch(err => {
                res.status(500).json(err)
            }
        )
    }
    findByEncodeId(req, res, next) {
        let params = req.params.params;
        params = (params && params.length) ? JSON.parse(params) : {};
        let _id = params.id;
        let whereQuery = {};
        whereQuery[this.primaryKey] = _id;
        this.db[this.baseModal].findOne(whereQuery)
            .then(result => {
                let whereQuery = {};
                whereQuery[this.primaryKey] = _id;
                let includesQuery = [];
                if (result.getModelIncludes && result.getModelIncludes()) {
                    result.getModelIncludes().forEach(icludeItem => {
                        if (this.db[icludeItem]) {
                            includesQuery.push({
                                model: this.db[icludeItem],
                                required: false,
                                where: {
                                    active: 'Y'
                                }
                            });
                        }
                    })
                }
                this.db[this.baseModal].find({
                    where: whereQuery,
                    include: includesQuery
                }).then(resFind => {

                    res.json({
                        message: 'success',
                        data: resFind, status: 1,
                    })
                })
            }).catch(err =>
            res.status(500).json(err)
        )
    }
    preSave(data, req, res) {
        return new Promise((resolve, reject) => {
            resolve(data);
        });
    }
    save(req, res, next) {
        const preFormData = req.body;
        this.preSave(preFormData).then(formData => {
            formData.created_at = new Date()
            formData.updated_at = new Date()
            let modalObj = this.db[this.baseModal].build(formData);
            modalObj.save().then(result => {
                let whereQuery = {};
                whereQuery[this.primaryKey] = result[this.primaryKey];
                let includesQuery = [];
                if (result.getModelIncludes && result.getModelIncludes()) {
                    result.getModelIncludes().forEach(icludeItem => {
                        if (this.db[icludeItem]) {
                            includesQuery.push({
                                model: this.db[icludeItem],
                                required: false,
                                where: {
                                    active: 'Y'
                                }
                            });
                        }
                    })
                }
                this.db[this.baseModal].find({
                    where: whereQuery,
                    include: includesQuery
                }).then(resFind => {
                    this.alterSave(resFind, req, res).then(data => {
                        res.json({
                            test: this.baseModal.modelIncludes,
                            message: 'success',
                            data: data,
                            status: 1,
                            includesQuery: includesQuery
                        });
                    });
                })
            }).catch(err =>
                res.status(500).json(err));
        }).catch(err => {
            res.status(500).json(err);
        });
    }
    alterSave(data, req, res) {
        return new Promise((resolve, reject) => {
            resolve(data);
        });
    }
    delete(req, res, next) {
        let _id = req.params.params;
        let whereQuery = {};
        whereQuery[this.primaryKey] = _id;
        let fields_to_update = {
            'active': 'N'
        };
        this.db[this.baseModal].update(fields_to_update,
            {where: whereQuery}
        ).then(result => {
            if (result) {
                res.json({
                    success: true,
                    messages: 'deleted'
                })
            } else {
                res.json({
                    success: false,
                    messages: 'Cant delete'
                })
            }
        }).catch(err =>
            res.status(500).json(err)
        )

    }
    deleteWithChild(parent, child, parent_id, childParent_id, id) {
        return new Promise((resolve, reject) => {
            const ParentEntity = new Promise((resolve, reject) => {
                let whereQuery = {}
                whereQuery[parent_id] = id;
                this.db[parent].update({active: 'N'}, {
                    where: whereQuery
                }).then(() => {
                    resolve(true);
                }).catch(err => {
                    reject(err);
                });
            });
            const ChildEntity = new Promise((resolve, reject) => {
                let whereQuery = {}
                whereQuery[childParent_id] = id;
                this.db[child].update({active: 'N'}, {
                    where: whereQuery
                }).then(() => {
                    resolve(true);
                }).catch(err => {
                    reject(err);
                });
            });
            Promise.all([ParentEntity, ChildEntity]).then(() => {
                resolve(true);
            }).catch((err) => {
                reject(err);
            })
        })
    }


    changeStatusWithChild(parent, child, parent_id, childParent_id, id,status) {
        return new Promise((resolve, reject) => {
            const UpdateTZ = moment(new Date());
            const ParentEntity = new Promise((resolve, reject) => {
                let whereQuery = {}
                whereQuery[parent_id] = id;
                this.db[parent].update({status: status, updated_at : UpdateTZ}, {
                    where: whereQuery
                }).then(() => {
                    resolve(true);
                }).catch(err => {
                    reject(err);
                });
            });
            const ChildEntity = new Promise((resolve, reject) => {
                let whereQuery = {}
                whereQuery[childParent_id] = id;
                this.db[child].update({status: status, updated_at : UpdateTZ}, {
                    where: whereQuery
                }).then(() => {
                    resolve(true);
                }).catch(err => {
                    reject(err);
                });
            });
            Promise.all([ParentEntity, ChildEntity]).then(() => {
                resolve(true);
            }).catch((err) => {
                reject(err);
            })
        })
    }

    deleteRoleCascade(role_id) {
        return new Promise((resolve, reject) => {
            this.db['roles'].findOne({where: {role_id: role_id, active: 'Y'}})
                .then(role => {
                    if (role) {
                        this.updateRoleAndUserToken(role_id, 'delete').then(() => {
                                resolve(true);
                        }).catch(err => reject(err))
                    }
                });
        })
    }
    deleteDidGroupFromCampaign(did_group_id,account_id){
        return new Promise((resolve,reject)=>{
            this.db['campaigns'].findAll({where : {account_id : account_id, status : 'Y', active : 'Y', config: {[Op.not]: null}}}).then((campaigns)=>{
                if(!!!campaigns || campaigns.length === 0){
                    resolve(true)
                }else{
                    let camps = campaigns.filter(camp => {
                        if(!!!camp.config.did_group_ids){
                            return false
                        }
                            return camp.config.did_group_ids.includes(did_group_id)
                    });
                    if(camps && camps.length !== 0){
                        camps.forEach(camp => {
                            let newDidGrpList = camp.config.did_group_ids
                            let index = newDidGrpList.indexOf(did_group_id);
                            if (index > -1) {
                                newDidGrpList.splice(index, 1);
                            }
                            this.db['campaigns'].update({updated_at : moment(new Date()), config : {...camp.config, did_group_ids : newDidGrpList}},{where : {campaign_id : camp.campaign_id}}).then(()=>{
                                resolve(true)
                            }).catch(err=>reject(err))
                        })
                    }else{
                        resolve(true)
                    }
                }
            }).catch(err=>reject(err))
        })
    }
    _deleteFromHooperByCallfileID = (listcallfile_id) => {
        return new Promise((resolve,reject) => {
            this.db['hoopers'].findAll({where : {listcallfile_id : listcallfile_id}}).then(callfiles_hooper => {
                if(callfiles_hooper && callfiles_hooper.length !== 0){
                    let callfiles_ids = callfiles_hooper.map(cf_h => cf_h.callfile_id);
                    this.db['hoopers'].destroy({where : {listcallfile_id : listcallfile_id}}).then(() => {
                        this.db['callfiles'].update({save_in_hooper : 'N'},{where : {callfile_id : callfiles_ids, to_treat : 'N'}}).then(() => {
                            resolve(true)
                        }).catch(err => reject(err))
                    }).catch(err => reject(err))
                }else{
                    resolve(true)
                }
            })
        })
    }
    deleteCascade(req, res, next) {
        let _id = req.params.params;
        switch (this.baseModal) {
            case 'didsgroups' :
                this.deleteWithChild('didsgroups', 'dids', 'did_id', 'did_group_id', _id).then(() => {
                    this.db['didsgroups'].findOne({where : {did_id : _id}}).then((didGp=>{
                        this.deleteDidGroupFromCampaign(parseInt(_id),didGp.account_id).then(()=>{
                            res.json({
                                success: true,
                                messages: 'deleted'
                            })
                        }).catch(err=>{
                            res.json({
                                success: false,
                                messages: 'Cant delete'
                            })
                        })
                    })).catch(err=>{
                        res.json({
                            success: false,
                            messages: 'Cant get DID group'
                        })
                    })
                }).catch((err) => {
                    res.json({
                        success: false,
                        messages: 'Cant delete'
                    })
                })
                break
            case 'roles' :
                this.deleteRoleCascade(_id).then(() => {
                    res.json({
                        success: true,
                        messages: 'deleted'
                    })
                }).catch((err) => {
                    res.json({
                        success: false,
                        messages: 'Cant delete'
                    })
                })
                break;
            case 'listcallfiles' :
                this.deleteWithChild('listcallfiles', 'callfiles', 'listcallfile_id', 'listcallfile_id', _id).then(() => {
                            this._deleteFromHooperByCallfileID(_id).then(() => {
                                res.json({
                                    success: true,
                                    messages: 'deleted'
                                })
                            }).catch((err) => {
                                res.json({
                                    success: false,
                                    messages: 'Cant delete Hoopers'
                                })
                            })

                }).catch((err) => {
                    res.json({
                        success: false,
                        messages: 'Cant delete'
                    })
                })
                break;
            default  :
                res.json({
                    success: false,
                    messages: 'Cannot deleteCascade from Table ( '+this.baseModal+' )'
                })
        }
    }

    changeStatusCascade(req, res, next){
        let _id = req.params.params;
        switch(this.baseModal){
            case 'didsgroups' :
                this.db['didsgroups'].findOne({where : {did_id : _id}}).then(didGp=>{
                    let status = didGp.status === 'Y' ? 'N' : 'Y'
                    this.changeStatusWithChild('didsgroups', 'dids', 'did_id', 'did_group_id', _id,status).then(() => {
                        res.json({
                            success: true,
                            messages: 'status changed Successfully !'
                        })
                    }).catch(err=>{
                        res.json({
                            success: false,
                            messages: 'Cant update Status'
                        })
                    })
                }).catch((err) => {
                    res.json({
                        success: false,
                        messages: 'Cant get DID group'
                    })
                })
                break;
            default  :
                res.json({
                    success: false,
                    messages: 'Cannot changeStatus from Table ( '+this.baseModal+' )'
                })
        }
    }
    update(req, res, next) {
        let _id = req.body[this.primaryKey];
        let dataRequest = req.body;
        const _this = this;
        const where_ = {};
        where_[this.primaryKey] = _id;
        let modalObj = this.db[this.baseModal].build();
        _this.beforeUpdate(req, res).then(() => {

            _this.db[this.baseModal].findOne({
                where: where_
            }).then(obj => {
                if (obj) {
                    const obj_before = obj.toJSON();
                    modalObj.fields.forEach(field => {
                        if ((typeof dataRequest[field]) !== 'undefined' && field !== this.primaryKey) {
                            if (dataRequest[field] === "") {
                                dataRequest[field] = null;
                            }
                            obj[field] = dataRequest[field];
                        }
                    });
                    obj.save().then(objSaved => {
                        //if(this.baseModal === 'callfiles') {
                        //_this.saveEntityNewRevision(objSaved, obj_before, req, res);
                        //}
                        _this.alterUpdate(obj, req, res).then(data => {
                            return res.json({
                                data: data,
                                status: true,
                                req: req.headers.authorization,
                            });
                        });
                    });
                } else {
                    res.status(500).json({
                        status: false,
                        messages: [{code: '001', message: 'Invalid object to update'}]
                    });
                }
                obj.save();
            }).catch(err =>
                res.status(500).json({
                    status: false,
                    messages: [{code: '002', message: 'error update'}]
                })
            );
        }).catch(err => {
            res.status(500).json(err);
        })
    }
    saveEntityNewRevision(obj, obj_before, req, res) {
        let _this = this;
        return new Promise(function (resolve, reject) {
            const obj_after =  typeof obj === 'object'? obj :obj.toJSON();
            let oldObj = obj_before;
            let newObj = obj_after;
            delete oldObj.updated_at;
            delete oldObj.note;
            delete oldObj.call_status;
            delete newObj.updated_at;
            delete newObj.note;
            delete newObj.call_status;
            const fields_changed = diff(oldObj, newObj);
                _this.getUserFromToken(req).then(users => {
                    if (users && users.user_id) {
                        let entity_revision = {
                            model_id: obj_before[_this.primaryKey],
                            model_name: _this.baseModal,
                            before: obj_before,
                            after: obj_after,
                            changes: fields_changed,
                            date: moment.unix(moment().unix()).format("YYYY-MM-DD HH:mm:ss"),
                            user_id: users.user_id
                        };
                        _this.db['revisions'].build(entity_revision).save().then(after_sa => {
                            entity_revision.id =after_sa.revision_id
                            resolve(entity_revision);
                        });
                    }
                });
        });
    }
    beforeUpdate(req, res) {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }
    alterUpdate(data, req, res) {
        return new Promise((resolve, reject) => {
            resolve(data);
        });
    }
    getUserFromToken(req) {
        return new Promise((resolve, reject) => {
            if (!req.headers.authorization) {
                return reject({
                    err: 'Error.EmptyToken',
                });
            }
            jwt.verify(req.headers.authorization.replace('Bearer ', ''), config.secret, (err, decodedToken) => {
                if (err) {
                    reject(err);
                } else {
                    this.db['users'].findOne({
                        where: {
                            user_id: decodedToken.user_id
                        }
                    }).then(user => {
                        resolve(user);
                    });
                }
            });
        });
    }
    find(req, res, next) {
        this.setRequest(req);
        this.setResponse(res);
        let modalObj = this.db[this.baseModal].build();
        let params = req.body;
        this.setRequestParams(params);
        let query = {};
        if(!!!params.meta_key_length){
            params.meta_key_length = 3
        }
        if (params.limit >= 1) {
            query.limit = params.limit;
        }
        if (params.offset >= 0) {
            query.offset = params.offset;
        }
        if (params.sortBy) {
            query.order = [
                [params.sortBy, params.sortDir]
            ];
        }
        const Op = Sequelize.Op;
        let whereQuerySearchMeta = {
            operator: 'and',
            conditions: []
        };
        let whereQuery = {};
        let whereQueryFilters = {};
        if (params.filter) {
            params.filter.forEach(filterItem => {
                if (filterItem.operator && filterItem.conditions && filterItem.conditions.length) {
                    let conditionsCollection = [];
                    filterItem.conditions.forEach(conditionItem => {
                        if (conditionItem.field && conditionItem.operator.toUpperCase().replace(' ', '_') === 'IS_NULL') {
                            conditionItem.value = null
                        }
                        if (conditionItem.field && conditionItem.operator && (typeof conditionItem.value !== 'undefined')) {
                            let fieldItemCondition = {};
                            let fieldItemConditionData = {};
                            if (conditionItem.operator.toUpperCase().replace(' ', '_') === 'IS_NULL') {
                                fieldItemConditionData[Op.eq] = null;
                            } else {
                                fieldItemConditionData[Op [conditionItem.operator]] = conditionItem.value;
                            }
                            fieldItemCondition[conditionItem.field] = fieldItemConditionData;
                            conditionsCollection.push(fieldItemCondition);
                        } else if (conditionItem.operator && conditionItem.conditions) {
                            let groupItemCondition = {};
                            groupItemCondition[Op [conditionItem.operator]] = [];
                            conditionItem.conditions.forEach(subConditionItem => {
                                let subFieldItemCondition = {};
                                let subbFieldItemConditionData = {};
                                subbFieldItemConditionData[Op [subConditionItem.operator]] = subConditionItem.value;
                                subFieldItemCondition[subConditionItem.field] = subbFieldItemConditionData;
                                groupItemCondition[Op [conditionItem.operator]].push(subFieldItemCondition);
                            });
                            conditionsCollection.push(groupItemCondition);
                        }
                    });
                    whereQueryFilters[Op [filterItem.operator]] = conditionsCollection;
                }
            });
        }
        if (whereQueryFilters) {
            let defaultOperator = (params && params.filter && params.filter.length && typeof params.filter[0].operator !== "undefined") ? params.filter[0].operator : 'and';
            whereQuery[Op [defaultOperator]] = [whereQueryFilters];
        }
        if (params.meta_key && params.meta_key.length >= params.meta_key_length) {
            let fieldsSearchMetas = [];
            if (params.fieldsSearchMetas && params.fieldsSearchMetas.length) {
                fieldsSearchMetas = params.fieldsSearchMetas;
            } else if (modalObj.fieldsSearchMetas && modalObj.fieldsSearchMetas.length) {
                modalObj.fieldsSearchMetas.forEach(field_name => {
                    fieldsSearchMetas.push(this.baseModal + '.' + field_name);
                });
            }
            if (fieldsSearchMetas && fieldsSearchMetas.length) {
                let subConditions = [];
                fieldsSearchMetas.forEach(field_name => {
                    subConditions.push(Sequelize.where(Sequelize.fn("concat", Sequelize.col(field_name)), {ilike: "%" + params.meta_key + "%"}));
                });
                let whereQueryMetaKey = {
                    [Op.or]: subConditions
                };
                if (whereQuery && whereQuery[Op ['and']]) {
                    whereQuery[Op ['and']].push(whereQueryMetaKey);
                } else if (whereQuery && whereQuery[Op ['or']]) {
                    whereQuery[Op ['or']].push(whereQueryMetaKey);
                } else {
                    whereQuery[Op ['and']] = [whereQueryMetaKey];
                }
            }
        }

        whereQuery = this.hookWhereFindQuery(whereQuery);
        if (whereQuery) {
            query.where = [whereQuery];
        }
        if (modalObj && typeof modalObj.rawAttributes.active !== "undefined" && query.where) {
            query.where.push({
                [Op.and]: {
                    'active': 'Y'
                }
            });
        }
        let includesQuery = [];
        if (params.includes) {
            params.includes.forEach(icludeItem => {
                if (this.db[icludeItem]) {
                    includesQuery.push({
                        model: this.db[icludeItem],
                        required: false,
                        where: {
                            active: 'Y'
                        }
                    });
                }
            })
        }
        if (includesQuery.length) {
            query.include = includesQuery;
        }
        let queryCountAll = {...query, ...{}};
        delete queryCountAll['limit']
        delete queryCountAll['offset']
        delete queryCountAll['include']
        queryCountAll.where = query.where;
        queryCountAll.include = query.include;
        this.db[this.baseModal].count(queryCountAll).then((countAll) => {
            let pages = Math.ceil(countAll / params.limit);
            if (params.page) {
                query.page = Math.ceil(countAll / params.limit);
                query.offset = params.limit * (params.page - 1)
            }
            this.db[this.baseModal].findAll(query).then((data) => {
                const attributes_res = {
                    count: countAll,
                    whereQuerySearchMeta: whereQuerySearchMeta,
                    filter: params.filter,
                    offset: query.offset,
                    limit: query.limit,
                    pages: pages
                };
                this.alterGetDataFind(data, res, attributes_res);
            }).catch(error => {
                res.status(500).json(error);
            });
        });
    }
    alterGetDataFind(data, res, attributes_res) {
        res.status(200).json({
            'data': data,
            'attributes': attributes_res
        })
    }
    hookWhereFindQuery(whereQuery) {
        return whereQuery;
    }
    model_history(req, res, next) {
        let _this = this;
        let {model_id, model_name} = req.body
        if (model_name == null || model_name === '') {
            res.send({
                success: false,
                data: null,
                messages: [
                    {
                        userMessage: 'Invalid model_name data',
                        internalMessage: 'Invalid model_name data'
                    }
                ]
            });
            return;
        }
        if (model_id == null || model_id === '') {
            res.send({
                success: false,
                data: null,
                messages: [
                    {
                        userMessage: 'Invalid model_id data',
                        internalMessage: 'Invalid model_id data'
                    }
                ]
            });
            return;
        }
        _this.db['revisions'].findAndCountAll({
            where: {
                model_id: model_id,
                model_name: model_name,
                active: 'Y'
            }
        }).then((countAll) => {
            _this.db['revisions'].findAll({
                where: {
                    model_id: model_id,
                    model_name: model_name,
                    active: 'Y'
                },
                order: [['date', 'DESC']],
                include: [{
                    model: _this.db['users']
                }]

            }).then((data) => {
                if (data) {
                    res.json({
                        message: 'success',
                        data: data,
                        count: countAll.count
                    })
                } else {
                    res.json({
                        message: 'Invalid model_id or model_name data',
                        data: null,
                    })
                }
            })
        })
    }
    updateUserToken(user_id,action,sip_device ={}){
        return new Promise((resolve,reject)=>{
            let updatedUser = {current_session_token: null}
            switch(action){
                case 'delete' : {
                    updatedUser.active = 'N';
                    break;
                }
                case 'Y' : {
                    updatedUser = {status : 'Y',updated_at : moment(new Date()),sip_device : sip_device};
                    break;
                }
                case 'N' : {
                    updatedUser.status = 'N';
                    updatedUser.updated_at = moment(new Date());
                    updatedUser.sip_device = sip_device;
                    break;
                }
            }
            this.db['users'].update(updatedUser,{where : {user_id : user_id, active : 'Y'}}).then(()=>{
                appSocket.emit('reload.Permission', {user_id: user_id});
                resolve(true);
            }).catch(err=>reject(err))
        })
    }
    updateRoleAndUserToken(role_id, action , editRole = {}) {
        return new Promise((resolve, reject) => {
            let updatedUser = {current_session_token: null};
            let updatedRole = {}
            let whereUser = {role_id: role_id, active: 'Y'}
            switch (action) {
                case 'delete' : {
                    updatedUser.role_id = null;
                    updatedUser.status = 'N';
                    updatedRole.active = 'N';
                    whereUser.status = 'Y';
                    break;
                }
                case 'N' : { // N means disable & Y for enable (status)
                    updatedUser.status = 'N';
                    updatedRole.status = 'N';
                    whereUser.status = 'Y';
                    break;
                }
                case 'Y' : {
                    updatedUser.status = 'Y';
                    updatedRole.status = 'Y';
                    whereUser.status = 'N';
                    break;
                }
                case 'edit' : {
                    updatedRole = editRole;
                }
            }
            this.db['users'].findAll({where: whereUser}).then(users => {
                let UsersIds = [];
                if (users && users.length !== 0) {
                    users.map((user) => UsersIds.push(user.user_id));
                } else {
                    resolve(true)
                }
                this.db['users'].update(updatedUser, {where: {user_id: UsersIds}}).then(() => {
                    this.db['roles'].update(updatedRole, {where: {role_id: role_id}}).then(()=> {
                        if (UsersIds && UsersIds.length !== 0) {
                            let index = 0;
                            UsersIds.forEach(user_id => {
                                appSocket.emit('reload.Permission', {user_id: user_id});
                                if (index < UsersIds.length - 1) {
                                    index++;
                                } else {
                                    resolve({
                                        success: true
                                    })
                                }
                            })
                        } else {
                            resolve({
                                success: true
                            })
                        }
                    }).catch(err=>reject(err))
                })
            }).catch(err => reject(err))

        })

    }
    deleteSubScriberOrAgentByUUID(uuid_sub,uuid_agent){
        return new Promise((resolve,reject)=>{
            const delete_Agent = new Promise((resolve,reject)=> {
                if(uuid_agent){
                    axios.get(`${base_url_cc_kam}api/v1/agents/${uuid_agent}`, call_center_authorization).then(() => {
                        axios.delete(`${base_url_cc_kam}api/v1/agents/${uuid_agent}`, call_center_authorization).then(() => {
                            resolve(true)
                        }).catch((err)=> reject(err))
                    }).catch((err)=>reject(err))
                }else{
                    resolve(true)
                }
            })
            Promise.all([delete_Agent]).then(data_user => {
                if(uuid_sub){
                    axios.get(`${base_url_cc_kam}api/v1/subscribers/${uuid_sub}`, call_center_authorization).then(() => {
                        axios.delete(`${base_url_cc_kam}api/v1/subscribers/${uuid_sub}`, call_center_authorization).then(() => {
                            resolve(true)
                        }).catch((err)=> reject(err))
                    }).catch((err)=>reject(err))
                }else{
                    resolve(true)
                }
            }).catch(err => reject(err))
        })
    }
    deleteDomainByUUID(domain_uuid){
        return new Promise((resolve,reject)=> {
            axios.get(`${base_url_cc_kam}api/v1/domains/${domain_uuid}`, call_center_authorization).then(() => {
                axios.delete(`${base_url_cc_kam}api/v1/domains/${domain_uuid}`, call_center_authorization).then(() => {
                    resolve(true)
                }).catch((err)=>reject(err))
            }).catch((err)=>reject(err))
        })
    }
    deleteEslServerByUUID(esl_server_uuid){
        return new Promise((resolve,reject)=> {
            axios.get(`${base_url_cc_kam}api/v1/servers/${esl_server_uuid}`, call_center_authorization).then(() => {
                axios.delete(`${base_url_cc_kam}api/v1/servers/${esl_server_uuid}`, call_center_authorization).then(() => {
                    resolve(true)
                }).catch((err)=>reject(err))
            }).catch((err)=>reject(err))
        })
    }

    _changeStatusTelco(status, TelcoName, TelcoUUID) {
        return new Promise((resolve, reject) => {
            axios
                .get(`${base_url_cc_kam}api/v1/${TelcoName}/${TelcoUUID}`, call_center_authorization).then((resp) => {
                let TelcoData = resp.data.result;
                if (!!!TelcoData) {
                    reject(TelcoName + 'NotFound')
                }
                let newTelcoData ;
                if(TelcoName === 'acls'){
                    newTelcoData = {...TelcoData,default: status === 'Y' ? 'allow' : 'deny', updated_at : moment(new Date())};
                }else{
                    newTelcoData = {...TelcoData,enabled: status === 'Y'};
                }
                axios
                    .put(`${base_url_cc_kam}api/v1/${TelcoName}/${TelcoUUID}`, newTelcoData, call_center_authorization).then((resp_update) => {
                    resolve(resp_update.data.result)
                }).catch(err => reject(err))
            }).catch(err => reject(err))
        })
    }
}


module.exports = {
    baseModelbo,
};
