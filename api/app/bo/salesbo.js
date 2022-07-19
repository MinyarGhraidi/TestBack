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

        this.db['users'].findOne({
            where:{
                user_id: id,
                account_id:account_id

            }
        }).then(sales=>{
            if (sales){
                this.db['meetings'].findAll({
                    where:{
                        sales_id: id,
                        account_id:account_id,
                        agent_id:{
                            [Op.in]: agent_id && agent_id.length !== 0 ? agent_id :sales.params.agents
                        }
                    },
                    include:[{
                        model: db.users
                    }]
                }).then(meetings=>{
                    if(meetings && meetings.length !== 0){
                            res.send({
                                success: true,
                                meetings: meetings,
                                sales: sales.params.agents
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

    agents_for_sales = (req, res, next) =>{
            let index =0;
            let data =[];
            let user_id = req.body.user_id;
        let account_id = req.body.account_id
        this.db['users'].findOne({
            where:{
                user_id: user_id,
                account_id:account_id

            }
        }).then(sales=>{
            sales.params.agents.forEach(item =>{
                this.db['users'].findOne({
                    where:{
                        user_id: item
                    }
                }).then(agent=>{
                    if (agent){
                        data.push(agent)
                    }
                    if(index< sales.params.agents.length -1){
                        index++;
                    }else{
                        res.send({
                            success: true,
                            agents: data
                        })
                    }
                })
            })
        })



    }
}

module.exports = Sales;