module.exports = (sequelize, Sequelize) => {
    const account = sequelize.define("ips", {
      ip_id: {
            primaryKey: true,
            autoIncrement: true,
            type: Sequelize.INTEGER
          },
          account_id: {
            type: Sequelize.INTEGER
          },
          ip_adress: {
            type: Sequelize.STRING
          },
          status: {
            type: Sequelize.INTEGER
          }
        },
        {timestamps: false,}
    );

    account.prototype.fields = [
      "ip_id",
      "account_id",
      "ip_adress",
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
