const {} = require("http-errors")
let bcrypt = require('bcryptjs');

module.exports = (sequelize, Sequelize) => {
    const user = sequelize.define("users", {
            user_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            uuid: {
                type: Sequelize.STRING
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
                defaultValue: 'admin'
            },
            account_id: {
                type: Sequelize.INTEGER
            },
            role_id: {
                type: Sequelize.INTEGER
            },
            domain: {
                type: Sequelize.STRING
            },
            options: {
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
        'domain',
        'options',
        'uuid'

    ],
        user.prototype.fieldsSearchMetas = [
            'user_id',
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
            'domain',
            'options',
            'uuid'
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
        })
    };

    return user
}
