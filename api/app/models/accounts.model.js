module.exports = (sequelize, Sequelize) => {
    const account = sequelize.define("accounts", {
        account_id: {
            primaryKey: true,
            autoIncrement: true,
            type: Sequelize.INTEGER
          },
      
         
      
          rate_group_id: {
            type: Sequelize.INTEGER
          },
      
          account_number: {
            type: Sequelize.STRING
          },
      
          first_name: {
            type: Sequelize.STRING
          },
      
          last_name: {
            type: Sequelize.STRING
          },
      
          company_name: {
            type: Sequelize.STRING
          },
      
          address_1: {
            type: Sequelize.STRING
          },
      
          address_2: {
            type: Sequelize.STRING
          },
      
          postal_code: {
            type: Sequelize.STRING
          },
          city: {
            type: Sequelize.STRING
          },
      
          telephone_1: {
            type: Sequelize.STRING
          },
      
          telephone_2: {
            type: Sequelize.STRING
          },
          email: {
            type: Sequelize.STRING
          },
          maxchannels: {
            type: Sequelize.INTEGER
          },
         
          maxcps: {
            type: Sequelize.INTEGER
          },
      
          status: {
            type: Sequelize.STRING
          },
      
          balance: {
            type: Sequelize.DECIMAL
          },
          overdraf_balance: {
            type: Sequelize.DECIMAL
          },
          
          login: {
            type: Sequelize.STRING
          },
        
          password: {
            type: Sequelize.STRING
          },
      
          account_type: {
            type: Sequelize.STRING
          },
      
          checkcli: {
            type: Sequelize.INTEGER
          },
       
          check404: {
            type: Sequelize.INTEGER
          },
      
           
          maxinboundchanels: {
            type: Sequelize.INTEGER
          },
      
          inbound_codecs: {
            type: Sequelize.STRING
          },
      
          outbound_codecs: {
            type: Sequelize.STRING
          },
      
        
            active: {
                allowNull: true,
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
           
        },
        {timestamps: false,}
    );

    account.prototype.fields = [
      "account_id",
      "rate_group_id",
      "account_number",
      "first_name",
      "last_name",
      "company_name",
      "address_1",
      "address_2",
      "postal_code",
      "city",
      "telephone_1",
      "telephone_2",
      "email",
      "maxchannels",
      "maxcps",
      "status",
      "balance",
      "overdraf_balance",
      "login",
      "password",
      "account_type",
      "checkcli",
      "check404",
      "maxinboundchanels",
      "inbound_codecs",
      "outbound_codecs",
      "active"
    ];

    account.prototype.fieldsSearchMetas = [
      "account_id",
      "rate_group_id",
      "account_number",
      "first_name",
      "last_name",
      "company_name",
      "address_1",
      "address_2",
      "postal_code",
      "city",
      "telephone_1",
      "telephone_2",
      "email",
      "maxchannels",
      "maxcps",
      "status",
      "balance",
      "overdraf_balance",
      "login",
      "password",
      "account_type",
      "checkcli",
      "check404",
      "maxinboundchanels",
      "inbound_codecs",
      "outbound_codecs",
      "active"
    ];

    return account;
};
