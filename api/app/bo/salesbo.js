const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
const {reject} = require("bcrypt/promises");

class Sales extends baseModelbo {
    constructor(){
        super('users', 'user_id');
        this.baseModal = "users";
        this.primaryKey = 'user_id';
    }

    getAllMeetings = (req, res, next) =>{
        let id = req.body.user_id;
        let account_id = req.body.account_id;
        const {Op}= db.sequelize;
        let agent_id = req.body.agents;
        let where
        if(agent_id && agent_id.length !== 0){
             where = {
                sales_id: id,
                 account_id:account_id,
                agent_id:{
                    [Op.in]: agent_id
                }
            }
        }else{
             where = {
                sales_id: id,
                 account_id:account_id
            }
        }
        this.db['users'].findOne({
            where:{
                user_id: id,
                account_id:account_id

            }
        }).then(sales=>{
            if (sales){
                this.db['meetings'].findAll({
                    where:where,
                    include:[{
                        model: db.users
                    }]
                }).then(meetings=>{
                    if(meetings && meetings.length !== 0){
                        this.agents_for_sales(sales.params.agents).then(result =>{
                            res.send({
                                success: true,
                                meetings: meetings,
                                agents: result.data
                            })
                        })

                    }else{
                        res.send({
                            success: true,
                            meetings: meetings,
                            message: 'this sales dont have meetings'
                        })
                    }
                })
            }
        })
    }

    agents_for_sales = (agents) =>{
        return new Promise((resolve, reject)=>{
            let index =0;
            let data =[];
            agents.forEach(item =>{
                this.db['users'].findOne({
                    where:{
                        user_id: item
                    }
                }).then(agent=>{
                    if (agent){
                        data.push(agent)
                    }
                    if(index< agents.length -1){
                        index++;
                    }else{
                        resolve({
                            success: true,
                            data: data
                        })
                    }
                })
            })

        })
    }
}

module.exports = Sales;