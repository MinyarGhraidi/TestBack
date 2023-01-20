module.exports =(sequelize, Sequelize) =>{
    const reminder = sequelize.define("reminders",{
        reminder_id:{
            primaryKey: true,
            autoIncrement: true,
            type: Sequelize.INTEGER
        },
        note:{
            type: Sequelize.STRING
        },
         call_file_id:{
             type: Sequelize.INTEGER
         },
        agent_id:{
            type: Sequelize.INTEGER
        },
        date:{
            type: Sequelize.STRING
        },
        time:{
            type: Sequelize.STRING
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
            active: {
                allowNull: true,
                type: Sequelize.STRING,
                defaultValue: 'Y'
            }
    },
        {timestamps: false})

    reminder.prototype.fields=[
        'reminder_id',
        'note',
        'call_file_id',
        'agent_id',
        'date',
        'time',
        'created_at',
        'updated_at'
    ]

    return reminder
}