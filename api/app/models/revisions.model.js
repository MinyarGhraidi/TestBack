module.exports = (sequelize, Sequelize) => {
    const account = sequelize.define("revisions", {
      revision_id: {
            primaryKey: true,
            autoIncrement: true,
            type: Sequelize.INTEGER
          },
      
          model_id: {
            type: Sequelize.INTEGER
          },
      
          model_name: {
            type: Sequelize.STRING
          },
      
          before: {
            type: Sequelize.JSONB
          },
      
          after: {
            type: Sequelize.JSONB
          },
          changes: {
            type: Sequelize.JSONB
          },
          date: {
            type: Sequelize.DATE
          },
          user_id: {
            type: Sequelize.INTEGER
          },

        },
        {timestamps: false,}
    );

    account.prototype.fields = [
      "revision_id",
      "model_id",
      "model_name",
      "before",
      "after",
      "date",
      "user_id"
      
    ];

    account.prototype.fieldsSearchMetas = [
      "revision_id",
      "model_id",
      "model_name",
      "before",
      "after",
      "date",
      "user_id"
    ];

    return account;
};
