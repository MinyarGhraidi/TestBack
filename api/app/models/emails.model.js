'use strict';
module.exports = (sequelize, Sequelize) => {
    const email = sequelize.define('emails', {
        email_id: {
            primaryKey: true,
            autoIncrement: true,
            type: Sequelize.INTEGER
        },
        user_id: {
            type: Sequelize.INTEGER,
        },
        is_sended: {
            type: Sequelize.STRING,
            defaultValue: 'N'
        },
        active: {
            type: Sequelize.STRING,
            defaultValue: 'Y'
        },
        category: {
            type: Sequelize.STRING,
        },
        last_password: {
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
        'user_id',
        'is_sended',
        'active',
        "category",
        'template',
        'last_password'
    ],
        email.prototype.fieldsSearchMetas = [
            'template',
        ]

    return email;
};