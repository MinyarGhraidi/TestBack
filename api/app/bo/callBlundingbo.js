const {baseModelbo} = require('./basebo');

class call_blundings extends baseModelbo {
    constructor() {
        super('call_blundings', 'id');
        this.baseModal = "call_blundings";
        this.primaryKey = 'id';
    }

    isStringAllNumbers = (str) => {
        return /^\d+$/.test(str);
    }
    checkPhone = (obj) => {
        return new Promise((resolve, reject) => {
            if (!this.isStringAllNumbers(obj.phone_number)) {
                return resolve({
                    success: false,
                    type: "not-allowed",
                    phone_number: obj.phone_number
                })
            }
            this.db['call_blundings'].findOne({where: {phone_number: obj.phone_number, active : 'Y'}}).then(call_b => {
                if (call_b) {
                    return resolve({
                        success: false,
                        type: "exists",
                        phone_number: obj.phone_number
                    })
                } else {
                    let modalObj = this.db['call_blundings'].build(obj)
                    modalObj
                        .save()
                        .then(() => {
                            return resolve({
                                success: true,
                                phone_number: obj.phone_number
                            })
                        })
                        .catch(err => {
                            reject(err)
                        })

                }
            }).catch(err => {
                reject(err)
            })
        })
    }

    async bulkCallBlending(req, res, send) {
        const alreadyExists = []
        const saved = []
        const notAllowed = []
        let data = req.body;
        let idx = 0;
        for (const call_b of data) {
            await this.checkPhone(call_b).then(resCheck => {
                resCheck.success ? saved.push({
                    phone_number: resCheck.phone_number,
                    status: 'added'
                }) : (resCheck.type === 'exists' ? alreadyExists.push({
                    phone_number: resCheck.phone_number,
                    status: 'exist'
                }) : notAllowed.push({phone_number: resCheck.phone_number, status: 'not-allowed'}))
                if (idx < data.length - 1) {
                    idx++
                } else {
                    res.send({
                        success: true,
                        data: {
                            added: saved,
                            deplicated: alreadyExists,
                            notAllowed
                        }
                    })
                }
            }).catch(err => {
                return this.sendResponseError(res, ['cannot add callB'], 1, 403)
            })
        }
    }

    updateCallBlending(req, res, next) {
        let data = req.body;
        let call_blending_id = data.id;
        delete data.id;
        this.db['call_blundings'].findOne({
            where: {
                phone_number: data.phone_number,
                id: {$ne: call_blending_id}
            }
        }).then(call_b => {
            if (call_b) {
                return res.send({
                    success: false,
                    status: 200,
                    message: 'deplicated'
                })
            } else {
                this.db['call_blundings'].update(data, {
                    where: {
                        id: call_blending_id
                    }
                }).then(() => {
                    return res.send({
                        success: true,
                        status: 200,
                        message: 'updated'
                    })
                })

            }
        }).catch(err => {
            return this.sendResponseError(res, ['cannot updated callB'], 1, 403)
        })
    }
}

module.exports = call_blundings;