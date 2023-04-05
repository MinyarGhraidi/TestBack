const {baseModelbo} = require('./basebo');

class Roles_crm extends baseModelbo {
    constructor() {
        super('roles_crms', 'id');
        this.baseModal = "roles_crms";
        this.primaryKey = 'id';
    }

    getIdRoleCrmByValue(array_values){
        return new Promise((resolve,reject)=>{
            let idx = 0;
            let resultValues = []
            array_values.forEach(value => {
                this.db['roles_crms'].findOne({
                    where: {value: value, active: 'Y'}
                }).then(role => {
                    resultValues.push(role.id)
                    if (idx < array_values.length - 1) {
                        idx++;
                    } else {
                        resolve(resultValues)
                    }
                }).catch(err => reject(err))
            })
        })
    }
}

module.exports = Roles_crm;