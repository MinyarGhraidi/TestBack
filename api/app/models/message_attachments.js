module.exports = (sequelize, DataTypes) => {
    const message_attachments = sequelize.define('message_attachments', {
        message_id: {
            allowNull: true,
            type: DataTypes.INTEGER
        },
        attachment_efile_id: {
            allowNull: true,
            type: DataTypes.INTEGER
        },
        attachment_post_id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        created_at: {
            allowNull: true,
            type: DataTypes.DATE,
        },
        updated_at: {
            allowNull: true,
            type: DataTypes.DATE
        },
        active: {
            allowNull: true,
            type: DataTypes.STRING,
            defaultValue: 'Y'
        },
    });

    message_attachments.prototype.fields = [
        'message_id',
        'attachment_efile_id',
        'attachment_post_id',
        'created_at',
        'updated_at',
        'active'
    ];

    message_attachments.prototype.fieldsSearchMetas = [
        'message_id',
        'attachment_efile_id',
        'attachment_post_id'
    ];

    return message_attachments;
}
