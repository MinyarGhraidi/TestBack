const {baseModelbo} = require('./basebo');

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
}

module.exports = dids;
