'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('acc_cdrs', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },

      timestamp:{
        type: Sequelize.STRING
      } ,
      context:{
        type: Sequelize.STRING
      } ,
      callid :{
        type: Sequelize.STRING
      },
      callDirection :{
        type: Sequelize.STRING
      },
      callStatus :{
        type: Sequelize.STRING
      },
      sipFromURI_CallCenter :{
        type: Sequelize.STRING
      },
      sipFromTag_CallCenter:{
        type: Sequelize.STRING
      } ,
      sipToURI_CallCenter :{
        type: Sequelize.STRING
      },
      sipToTag_CallCenter :{
        type: Sequelize.STRING
      },
      hangupCause :{
        type: Sequelize.STRING
      },
      startTime :{
        type: Sequelize.STRING
      },
      answerTime:{
        type: Sequelize.STRING
      } ,
      endTime :{
        type: Sequelize.STRING
      },
      durationSec :{
        type: Sequelize.STRING
      },
      durationMsec :{
        type: Sequelize.STRING
      },
      privacy:{
        type: Sequelize.STRING
      } ,
      failuresipcode :{
        type: Sequelize.STRING
      },
      failuresipreasonphrase :{
        type: Sequelize.STRING
      },
      callID :{
        type: Sequelize.STRING
      },
      customVars :{
        type: Sequelize.STRING
      },
      agent :{
        type: Sequelize.STRING
      },
      campaignId:{
        type: Sequelize.STRING
      },
      eventName :{
        type: Sequelize.STRING
      },
      memberUUID :{
        type: Sequelize.STRING
      },
      queueJoinedTime :{
        type: Sequelize.STRING
      },
      queue :{
        type: Sequelize.STRING
      },
      side:{
        type: Sequelize.STRING
      } ,
      memberSessionUUID :{
        type: Sequelize.STRING
      },
      sipFromURI_Dailer:{
        type: Sequelize.STRING
      },
      sipFromTag_Dailer:{
        type: Sequelize.STRING
      } ,
      sipToURI_Dailer :{
        type: Sequelize.STRING
      },
      sipToTag_Dailer :{
        type: Sequelize.STRING
      },
      call_events: {
        type: Sequelize.JSONB
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
