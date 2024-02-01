'use strict';
module.exports = (sequelize, DataTypes) => {
  const ivr_menus = sequelize.define('ivr_menus', {
    name: DataTypes.STRING,
    extension: DataTypes.STRING,
    active: DataTypes.STRING,
    flow: DataTypes.JSONB,
    compaign_id: DataTypes.INTEGER,
    status: DataTypes.STRING
  }, {});
  ivr_menus.associate = function(models) {
    // associations can be defined here
  };
  return ivr_menus;
};