const {baseModelbo} = require('./basebo');
const {Op} = require("sequelize");
const db = require("../models");

class dids extends baseModelbo {
    constructor() {
        super('dids', 'id');
        this.baseModal = "dids";
        this.primaryKey = 'id';
    }

    saveBulk(req, res, next) {
        let dids = req.body
        if (!!!dids) {
            this.sendResponseError(res, ['data_is_required'])
            return
        }
        this.db['dids'].bulkCreate(dids).then(save_list => {
            res.send({
                success: true,
                status: 200
            })
        }).catch(err => {
            this.sendResponseError(res, ['error.saveBulk'])
        })
    }

    deleteDiD(req, res, next) {
        let dids = req.body;
        if (!!!dids.did_group_id || (dids.number && dids.number.length === 0)) {
            this.sendResponseError(res, ['data_is_required'])
            return
        }

        let sql = `UPDATE dids as did
                   set active = 'N'
                   where number in (:number)
                     and did.did_group_id = :did_group_id `
        db.sequelize['crm-app'].query(sql, {
            type: db.sequelize['crm-app'].QueryTypes.SELECT,
            replacements: {
                did_group_id: dids.did_group_id,
                number: dids.number
            }
        }).then(result => {
            res.send({
                success: true,
                status: 200,
                message: ['dids released with success']
            })
        }).catch(err => {
            this.sendResponseError(res, ['error.deleteDids'])
        })

    }
}

module.exports = dids;
