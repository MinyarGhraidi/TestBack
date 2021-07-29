const {TooManyRequests} = require("http-errors")

module.exports = (sequelize, Sequelize) => {
    const efile = sequelize.define("efiles", {
            file_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            file_name: {
                type: Sequelize.TEXT
            },
            original_name: {
                type: Sequelize.TEXT
            },
            file_title: {
                type: Sequelize.TEXT
            },
            active: {
                allowNull: true,
                type: Sequelize.TEXT,
                defaultValue: 'Y'
            },
            uri: {
                type: Sequelize.TEXT,
            },
            file_extension: {
                type: Sequelize.TEXT,
            },
            file_type: {
                type: Sequelize.TEXT,
            },
            file_size: {
                type: Sequelize.INTEGER,
            },
            doc_type: {
                type: Sequelize.TEXT,
            },
            picture: {
                type: Sequelize.TEXT,
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

    efile.prototype.fields = [
        'file_id',
        'file_name',
        'original_name',
        'file_title',
        "active",
        'uri',
        'file_extension',
        "file_type",
        'file_size',
        'doc_type',
        "picture",
        'created_at',
        'updated_at'
    ],
        efile.prototype.fieldsSearchMetas = [
            'file_id',
            'file_name',
            'original_name',
            'file_title',
            "active",
            'uri',
            'file_extension',
            "file_type",
            'file_size',
            'doc_type',
            "picture",
            'created_at',
            'updated_at'
        ]
        // ,
        // efile.associate = function (models) {
        //     efile.belongsTo(models.accounts, {
        //         foreignKey: 'account_id'
        //     });
        // };
    return efile
}