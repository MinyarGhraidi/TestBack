const moment = require('moment');
const jwt = require('jsonwebtoken');
const config = require('../config/config.json');
const db = require('../models');
const diff = require("deep-object-diff").diff;
const Sequelize = require('sequelize');

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
    deleteRoleCascade(role_id){
        return new Promise((resolve, reject)=> {
            this.db['roles'].findOne({where: {role_id: role_id, active: 'Y'}})
                .then(role => {
                    if (role) {
                        let roles_name = ['sales','user'];
                        const roles_ids = [];
                        this.db['roles_crms'].findAll({
                            where: {
                                active: 'Y',
                                value: {
                                    in: roles_name
                                }
                            }
                        }).then((roles_crm) => {
                            roles_crm.map((role)=>{
                                roles_ids.push(role.id);
                            });
                            this.db['users'].update({status: 'N', role_id : null}, {
                                where: {
                                    role_crm_id: {
                                        in : roles_ids
                                    },
                                    role_id: role.role_id,
                                    active: 'Y'
                                }
                            }).then(() => {
                                this.db['roles'].update({active: 'N'}, {
                                    where: {
                                        role_id: role_id,
                                    }
                                }).then(() => {
                                   resolve(true);
                                }).catch(err => {
                                    reject(err);
                                })
                            })
                        }).catch(err => {
                            reject(err);
                        });
                    }
                }).catch(err => {
                reject(err);
            })
        })

    }

    deleteCascade(req, res, next) {
        let _id = req.params.params;
        switch (this.baseModal) {
            case 'didsgroups' :
                this.deleteWithChild('didsgroups', 'dids', 'did_id', 'did_group_id', _id).then(() => {
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
                break
            case 'roles' :
                this.deleteRoleCascade(_id).then(()=>{
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
                break
            default  :
                res.json({
                    success: false,
                    messages: 'Something wrong contact the admin'
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
                        _this.saveEntityNewRevision(objSaved, obj_before, req, res);
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
            const obj_after = obj.toJSON();
            const fields_changed = diff(obj_before, obj_after);
            if (Object.keys(fields_changed).length > 0) {
                _this.getUserFromToken(req).then(users => {
                    if (users && users.account_id) {
                        let entity_revision = {
                            model_id: obj_before[_this.primaryKey],
                            model_name: _this.baseModal,
                            before: obj_before,
                            after: obj_after,
                            changes: fields_changed,
                            date: moment.unix(moment().unix()).format("YYYY-MM-DD HH:mm:ss"),
                            user_id: users.account_id
                        };
                        _this.db['revisions'].build(entity_revision).save().then(after_sa => {
                            resolve(entity_revision);
                        });
                    }
                });
            }
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
        if (params.meta_key && params.meta_key.length >= 3) {
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

}


module.exports = {
    baseModelbo,
};
