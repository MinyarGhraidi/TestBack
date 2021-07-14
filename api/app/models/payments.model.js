module.exports = (sequelize, Sequelize) => {
    const payment = sequelize.define("payments", {
      payment_id: {
            primaryKey: true,
            autoIncrement: true,
            type: Sequelize.INTEGER
          },
          account_id: {
            type: Sequelize.INTEGER
          },
      
          ammount: {
            type: Sequelize.STRING
          },
      
          lastbalance: {
            type: Sequelize.STRING
          },
      
          newbalance: {
            type: Sequelize.STRING
          },
      
          note: {
            type: Sequelize.STRING
          },
      
          type: {
            type: Sequelize.STRING
          },
          paymentdate: {
            type: Sequelize.DATE
          },
            active: {
                allowNull: true,
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
           
        },
        {timestamps: false,}
    );

    payment.prototype.fields = [
      "payment_id",
      "account_id",
      "ammount",
      "lastbalance",
      "newbalance",
      "note",
      "type",
      "active"
    ];

    payment.prototype.fieldsSearchMetas = [
      "payment_id",
      "account_id",
      "ammount",
      "lastbalance",
      "newbalance",
      "note",
      "type",
      "active"
    ];

    return payment;
};
