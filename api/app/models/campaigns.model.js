module.exports = (sequelize, Sequelize) => {
    const campaign = sequelize.define("campaigns", {
            campaign_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            campaign_name: {
                type: Sequelize.STRING
            },
            campaign_description: {
                type: Sequelize.STRING
            },
            campaign_type: {
                type: Sequelize.STRING
            },
            list_order: {
                type: Sequelize.STRING
            },
            list_mix: {
                type: Sequelize.BOOLEAN
            },
            hopper: {
                type: Sequelize.INTEGER
            },
            dial_level: {
                type: Sequelize.INTEGER
            },
            dialtimeout: {
                type: Sequelize.INTEGER,
            },
            active: {
                allowNull: true,
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
            account_id: {
                type: Sequelize.INTEGER,
            },
            agents: {
                type: Sequelize.JSONB,
            },
            params: {
                type: Sequelize.JSONB,
            },
            created_at: {
                allowNull: true,
                type: Sequelize.DATE,
                defaultValue: new Date()
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE,
                defaultValue: new Date()
            },
            trunck_id: {
                type: Sequelize.INTEGER
            },
            script: {
                type: Sequelize.STRING
            },
            call_status_ids : {
                type: Sequelize.JSONB
            },
            config : {
                type: Sequelize.JSONB
            },
            sql_campaign_id: {
                type: Sequelize.INTEGER
            },
            queue_count:{
                type: Sequelize.INTEGER
            }
        },
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
        'updated_at',
        'agents',
        'status',
        'params',
        'trunck_id',
        'script',
        'call_status_ids',
        'config',
        "sql_campaign_id",
        'queue_count'

    ]
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
            'updated_at',
            'agents',
            'status',
            'trunck_id',
            'script',
            'call_status_ids',
            'config',
            'queue_count'
        ]
    campaign.associate = function (models) {
        campaign.belongsTo(models.accounts, {
            foreignKey: 'account_id'
        });
        campaign.hasMany(models.listcallfiles,{
            foreignKey: 'campaign_id'
        })
    };

    return campaign
}
