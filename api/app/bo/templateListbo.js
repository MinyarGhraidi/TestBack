const {baseModelbo} = require("./basebo");
const moment = require("moment/moment");
const listcallfilesbo = require('./listcallfilesbo')
let _listcallfilesbo = new listcallfilesbo;

class TemplateListbo extends baseModelbo{
    constructor() {
        super('templates_list_call_files', 'templates_list_call_files_id');
        this.baseModal = 'templates_list_call_files';
        this.primaryKey = 'templates_list_call_files_id'
    }
    _changeStatus = (template_id, status) => {
        return new Promise((resolve,reject) => {
            this.db['templates_list_call_files'].update({status : status, updated_at : moment(new Date())}, {where: {templates_list_call_files_id: template_id, active : 'Y'}}).then(() => {
                if(status === 'N'){
                    this.db['listcallfiles'].findAll({
                        where: {
                            active: 'Y',
                            templates_id: template_id
                        }
                    }).then(listcallfiles => {
                        if(listcallfiles && listcallfiles.length !== 0){
                            listcallfiles.forEach(lcf => {
                                _listcallfilesbo._changeStatusLCF(lcf.listcallfile_id, status).then(() => {
                                    resolve(true)
                                }).catch(err => reject(err))
                            })
                        }else{
                            resolve(true)
                        }
                    }).catch(err => reject(err))
                }else{
                    resolve(true)
                }
            }).catch(err => reject(err))
        })
    }
    changeStatus = (req,res,next) => {
        const {template_id, status} = req.body
        if(!!!template_id){
            return this.sendResponseError(res,['emptyBody'],1,403)
        }
        this._changeStatus(template_id,status).then(() => {
           return  res.send({
                status : 200,
                success : true
            })
        }).catch(err => {
            return this.sendResponseError(res,['ErrorChangeStatus',err],2,403)
        })
    }
    deleteTemplate = (req,res,next) => {
        let template_id = req.body.template_id
        this.db['templates_list_call_files'].update({active : "N", updated_at : moment(new Date())}, {where: {templates_list_call_files_id: template_id}}).then(() => {
            this.db['listcallfiles'].findAll({
                where: {
                    active: 'Y',
                    templates_id: template_id
                }
            }).then(listcallfiles => {
                if(listcallfiles && listcallfiles.length !== 0){
                    listcallfiles.forEach(lcf => {
                        _listcallfilesbo._changeStatusLCF(lcf.listcallfile_id, "N").then(() => {
                            return res.send({
                                status: 200,
                                success :true
                            })
                        }).catch(err => {
                            this.sendResponseError(res,["cannot delete template"],0,403)
                        })
                    })
                }else{
                    return res.send({
                        status: 200,
                        success :true
                    })
                }
            }).catch(err => {
                this.sendResponseError(res,["cannot delete template"],1,403)
            })
        })

        }
}

module.exports = TemplateListbo
