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
            allowNull: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        }
    });

    message_attachments.prototype.fields = [
        'message_id',
        'attachment_efile_id',
        'attachment_post_id'
    ];

    message_attachments.prototype.fieldsSearchMetas = [
        'message_id',
        'attachment_efile_id',
        'attachment_post_id'
    ];

    return message_attachments;
}
