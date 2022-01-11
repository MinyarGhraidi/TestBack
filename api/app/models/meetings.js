'use strict';
module.exports = (sequelize, DataTypes) => {
  const meetings = sequelize.define('meetings', {
    meeting_id: DataTypes.INTEGER
  }, {});
  meetings.associate = function(models) {
    // associations can be defined here
  };
  return meetings;
};