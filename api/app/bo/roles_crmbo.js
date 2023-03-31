const {baseModelbo} = require('./basebo');

class Roles_crm extends baseModelbo {
    constructor() {
        super('roles_crms', 'id');
        this.baseModal = "roles_crms";
        this.primaryKey = 'id';
    }

    getIdRoleCrmByValue(value){
        return new Promise((resolve,reject)=>{
            this.db['roles_crms'].findOne({
                where: {value: value, active: 'Y'}
            }).then(role => {
                resolve(role.id)
            }).catch(err => reject(err))
        })
    }
}

module.exports = Roles_crm;