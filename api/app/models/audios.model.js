const {TooManyRequests} = require("http-errors")

module.exports = (sequelize, Sequelize) => {
    const audio = sequelize.define("audios", {
            audio_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            audio_name: {
                type: Sequelize.STRING
            },
            audio_type: {
                type: Sequelize.STRING
            },
            account_id: {
                type: Sequelize.INTEGER
            },
            file_id: {
                type: Sequelize.INTEGER
            },
            active: {
                allowNull: true,
                type: Sequelize.TEXT,
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
            },
        },
        {timestamps: false,}
    )

    audio.prototype.fields = [
        'audio_id',
        'audio_name',
        'audio_type',
        'account_id',
        "active",
        'created_at',
        'file_id',
        'updated_at'
    ],
        audio.prototype.fieldsSearchMetas = [
            'audio_id',
            'audio_name',
            'audio_type',
            'account_id',
            "active",
            'created_at',
            'file_id',
            'updated_at'
        ]
        // ,
        // efile.associate = function (models) {
        //     efile.belongsTo(models.accounts, {
        //         foreignKey: 'account_id'
        //     });
        // };
    return audio
}