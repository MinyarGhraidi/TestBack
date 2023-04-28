const {baseModelbo} = require("../../bo/basebo");
const agentbo = require('../../bo/agentsbo')
let _agentsbo = new agentbo;


class KillSessions extends baseModelbo {

    cronKillSessions = () => {
        return new Promise((resolve,reject) => {
            let idx = 0;
            this.db['roles_crms'].findOne({
                where: {value: 'agent', active: 'Y'}
            }).then(role => {
                this.db['users'].findAll({where: {active: 'Y', role_crm_id: role.id, "params.status" : {$ne : 'logged-out'}}}).then(users => {
                    users.forEach(user => {
                        _agentsbo._logoutAgent(user.user_id)
                        if (idx < users.length - 1) {
                            idx++
                        } else {
                            resolve({message: users.length + 'sessions killed !', cron : "cronKillSessions"})
                        }
                    })

                }).catch(err => reject(err))
            }).catch(err => reject(err))
        })
    }

}
module.exports = KillSessions