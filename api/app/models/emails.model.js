'use strict';
module.exports = (sequelize, Sequelize) => {
    const email = sequelize.define('emails', {
        email_id: {
            primaryKey: true,
            autoIncrement: true,
            type: Sequelize.INTEGER
        },
        account_id: {
            type: Sequelize.INTEGER,
        },
        is_sended: {
            type: Sequelize.STRING,
        },
        active: {
            type: Sequelize.STRING,
        },
        category: {
            type: Sequelize.STRING,
        },
        template: {
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
    }, {timestamps: false,})

    email.prototype.fields = [
        'email_id',
        'account_id',
        'is_sended',
        'active',
        "category",
        'template',
    ],
        email.prototype.fieldsSearchMetas = [
            'template',
        ]

    return email;
};