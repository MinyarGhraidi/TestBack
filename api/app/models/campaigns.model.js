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
            max_sales_meet: {
                type: Sequelize.INTEGER
            },
            date_start_meet: {
                type: Sequelize.STRING
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE,
                defaultValue: new Date()
            },
            current_strategy: {
                type: Sequelize.STRING
            },
            trunck_id: {
                type: Sequelize.INTEGER
            },
            script: {
                type: Sequelize.STRING
            },
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
        'current_strategy',
        'max_sales_meet',
        'date_start_meet',
        'trunck_id',
        'script'

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
            'current_strategy',
            'max_sales_meet',
            'date_start_meet',
            'trunck_id',
            'script'
        ]
    campaign.associate = function (models) {
        campaign.belongsTo(models.accounts, {
            foreignKey: 'account_id'
        });
    };

    return campaign
}
