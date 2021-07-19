const {} = require("http-errors")
let bcrypt = require('bcryptjs');

module.exports = (sequelize, Sequelize) => {
    const agent = sequelize.define("agents", {
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
                defaultValue: 'agent'
            },
            account_id: {
                type: Sequelize.INTEGER
            },
            role_id: {
                type: Sequelize.INTEGER
            },
            status: {
                type: Sequelize.STRING
            },
            active: {
                allowNull: true,
                type: Sequelize.STRING,
                defaultValue: 'Y'
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

    agent.prototype.fields = [
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
        'updated_at'
    ],
        agent.prototype.fieldsSearchMetas = [
            'user_id',
            'username',
            'first_name',
            'last_name',
            'email',
            'user_type',
            'status',
            'role_id',
            'account_id'
        ],
        agent.prototype.setPassword_hash = function (password) {
            let salt = bcrypt.genSaltSync();
            this.password_hash = bcrypt.hashSync(password, salt);
        };
        agent.prototype.verifyPassword = function (password) {
            return bcrypt.compareSync(password, this.password_hash);
        };
    agent.associate = function (models) {
        agent.belongsTo(models.roles, {
            foreignKey: 'role_id'
        });
        agent.belongsTo(models.accounts, {
            foreignKey: 'account_id'
        })
    };

    return agent
}
