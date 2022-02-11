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
        const {Op}= db.sequelize;
        console.log('reqqqq', req.body.filter[0].conditions)
        let agent_id = req.body.filter[0].conditions[0].value[0] ? req.body.filter[0].conditions[0].value : null;
        let where
        if(agent_id){
             where = {
                sales_id: id,
                agent_id:{
                    [Op.in]: agent_id
                }
            }
        }else{
             where = {
                sales_id: id,
            }
        }



        this.db['users'].findOne({
            where:{
                user_id: id,

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