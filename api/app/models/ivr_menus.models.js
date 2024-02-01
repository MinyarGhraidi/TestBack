module.exports=(sequelize,Sequelize) =>{
    const ivr_menus = sequelize.define("ivr_menus", {
        ivr_menu_id:{
            primaryKey : true ,
            autoIncrement : true,
            type: Sequelize.INTEGER
        },
        name:{
            type: Sequelize.STRING
        },
        extension:{
            type: Sequelize.STRING
        },
        active: {
            allowNull: true,
            type: Sequelize.STRING,
            defaultValue: "Y",
        },
        flow:{
            type: Sequelize.JSONB
        },
        campaign_id: {
            type: Sequelize.INTEGER
        },
        status :{
            type: Sequelize.STRING,
            defaultValue: 'Y',
        }
    },
    {timestamps: false,}
    )
    ivr_menus.prototype.fields =[
        'ivr_menu_id',
        'name',
        'extension',
        'active',
        'flow',
        'status',
        'campaign_id'


    ]
    ivr_menus.prototype.fieldsSearchMeats = [
        'ivr_menu_id',
        'name',
        'extension',
        'active',
        'flow',
        'status',
        'campaign_id'
    ]
    return ivr_menus;
}