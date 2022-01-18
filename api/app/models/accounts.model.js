module.exports = (sequelize, Sequelize) => {
    const account = sequelize.define(
        "accounts",
        {
            account_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER,
            },
            account_code: {
                type: Sequelize.STRING,
            },
            first_name: {
                type: Sequelize.STRING,
            },
            last_name: {
                type: Sequelize.STRING,
            },
            company: {
                type: Sequelize.STRING,
            },
            adresse: {
                type: Sequelize.STRING,
            },
            country: {
                type: Sequelize.STRING,
            },
            city: {
                type: Sequelize.STRING,
            },
            zip_code: {
                type: Sequelize.STRING,
            },
            tel: {
                type: Sequelize.STRING,
            },
            mobile: {
                type: Sequelize.STRING,
            },
            email: {
                type: Sequelize.STRING,
            },
            nbr_account: {
                type: Sequelize.INTEGER,
            },
            white_label: {
                type: Sequelize.BOOLEAN,
            },
            log: {
                type: Sequelize.STRING,
            },
            white_label_app_name: {
                type: Sequelize.STRING,
            },
            domain: {
                type: Sequelize.STRING,
            },
            active: {
                allowNull: true,
                type: Sequelize.STRING,
                defaultValue: "Y",
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: "Y",
            },
            created_at: {
                allowNull: true,
                type: Sequelize.DATE,
                defaultValue: new Date(),
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE,
                defaultValue: new Date(),
            },
            role_crm_id: {
                type: Sequelize.INTEGER
            },
            user_id :{
                type: Sequelize.INTEGER
            }
        },
        {timestamps: false}
    );

    account.prototype.fields = [
        "account_id",
        "account_code",
        "first_name",
        "last_name",
        "company",
        "adresse",
        "country",
        "city",
        "zip_code",
        "tel",
        "mobile",
        "email",
        "nbr_account",
        "white_label",
        "log",
        "white_label_app_name",
        "domain",
        "active",
        "created_at",
        "updated_at",
        "status",
        "role_crm_id",
        "user_id"
    ];

    account.prototype.fieldsSearchMetas = [
        "account_id",
        "account_code",
        "first_name",
        "last_name",
        "company",
        "adresse",
        "country",
        "city",
        "zip_code",
        "tel",
        "mobile",
        "email",
        "nbr_account",
        "white_label",
        "log",
        "white_label_app_name",
        "domain",
        "active",
        "created_at",
        "updated_at",
        "status",
        "role_crm_id",
        "user_id"
    ];

    account.associate = function (models) {
        account.belongsTo(models.roles_crms, {
            foreignKey: 'role_crm_id'
        });
        // account.belongsTo(models.users), {
        //     foreignKey: 'user_id'
        // }
    }

    return account;
};
