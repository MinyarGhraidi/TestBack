module.exports = (sequelize, Sequelize) => {
    const campaign = sequelize.define("campaigns", { 
        campaign_id : {
            primaryKey : true,
            autoIncrement: true,
            type: Sequelize.INTEGER
        },
        campaign_name : {
            type : Sequelize.STRING
        },
        campaign_description : {
            type : Sequelize.STRING
        },
        campaign_type : {
            type : Sequelize.STRING
        },
        list_order : {
            type : Sequelize.STRING
        },
        list_mix : {
            type : Sequelize.BOOLEAN
        },
        hopper : {
            type : Sequelize.INTEGER
        },
        dial_level : {
            type : Sequelize.INTEGER
        },
        dialtimeout : {
            type: Sequelize.INTEGER,
        },
        active: {
            allowNull: true,
            type: Sequelize.STRING,
            defaultValue: 'Y'
        },
        account_id: {
            type: Sequelize.INTEGER,
        },
        created_at : {
            allowNull: true,
            type: Sequelize.DATE,
            defaultValue: new Date()
        }, 
        updated_at : {
            allowNull: true,
            type: Sequelize.DATE,
            defaultValue: new Date()
        }},
        {timestamps: false,}
        );

        campaign.prototype.fields = [
            'campaign_id',
            'campaign_name',
            'campaign_description',
            'campaign_type',
            'list_order',
            'list_mix',
            'hopper',
            'dial_level',
            'dialtimeout',
            'created_at', 
            'updated_at'
        ],
        campaign.prototype.fieldsSearchMetas = [
            'campaign_id',
            'campaign_name',
            'campaign_description',
            'campaign_type',
            'list_order',
            'list_mix',
            'hopper',
            'dial_level',
            'dialtimeout',
            'created_at', 
            'updated_at'  
        ]
        campaign.associate = function (models) {
            campaign.belongsTo(models.accounts, {
                foreignKey: 'account_id'
            });
        }; 

        return campaign
}