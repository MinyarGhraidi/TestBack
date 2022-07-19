const {} = require("http-errors")
let bcrypt = require('bcryptjs');

module.exports = (sequelize, Sequelize) => {
    const user = sequelize.define("users", {
            user_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            username: {
                type: Sequelize.STRING
            },
            password_hash: {
                type: Sequelize.STRING
            },
            first_name: {
                type: Sequelize.STRING
            },
            last_name: {
                type: Sequelize.STRING
            },
            email: {
                type: Sequelize.STRING
            },
            user_type: {
                type: Sequelize.STRING,
            },
            account_id: {
                type: Sequelize.INTEGER
            },
            role_id: {
                type: Sequelize.INTEGER
            },
            sip_device: {
                type: Sequelize.JSONB
            },
            params: {
                type: Sequelize.JSONB
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
            active: {
                allowNull: true,
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
            isAssigned: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            campaign_id: {
                type: Sequelize.INTEGER,
                defaultValue: 0
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
            role_crm_id :{
                type: Sequelize.INTEGER
            },
            profile_image_id :{
                type: Sequelize.INTEGER
            }
        },
        {timestamps: false})

    user.prototype.fields = [
        'user_id',
        'username',
        'password_hash',
        'first_name',
        'last_name',
        'email',
        'user_type',
        'account_id',
        'role_id',
        'status',
        'active',
        'created_at',
        'updated_at',
        'isAssigned',
        'campaign_id',
        'sip_device',
        'params',
        'role_crm_id',
        'profile_image_id'

    ],
        user.prototype.fieldsSearchMetas = [
            'username',
            'first_name',
            'last_name',
            'email',
            'user_type',
            'status',
            'role_id',
            'account_id',
            'isAssigned',
            'campaign_id',
            "sip_device",
            'params',
            'role_crm_id'
        ],
        user.prototype.setPassword_hash = function (password) {
            let salt = bcrypt.genSaltSync();
            this.password_hash = bcrypt.hashSync(password, salt);
        };
        user.prototype.verifyPassword = function (password) {
            return bcrypt.compareSync(password, this.password_hash);
        };
    user.associate = function (models) {
        user.belongsTo(models.roles, {
            foreignKey: 'role_id'
        });
        user.belongsTo(models.accounts, {
            foreignKey: 'account_id'
        });
        user.belongsTo(models.roles_crms, {
            foreignKey: 'role_crm_id'
        })
    };

    return user
}
