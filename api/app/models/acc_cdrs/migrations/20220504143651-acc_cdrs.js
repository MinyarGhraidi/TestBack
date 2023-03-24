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
      calldirection :{
        type: Sequelize.STRING
      },
      callstatus :{
        type: Sequelize.STRING
      },
      sipfromuri_callcenter :{
        type: Sequelize.STRING
      },
      sipfromtag_callcenter:{
        type: Sequelize.STRING
      } ,
      siptouri_callcenter :{
        type: Sequelize.STRING
      },
      sipToTag_CallCenter :{
        type: Sequelize.STRING
      },
      hangupcause :{
        type: Sequelize.STRING
      },
      start_time :{
        type: Sequelize.STRING
      },
      answertime:{
        type: Sequelize.STRING
      } ,
      end_time :{
        type: Sequelize.STRING
      },
      durationsec :{
        type: Sequelize.STRING
      },
      durationmsec :{
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
      custom_vars :{
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
      },
      debit:{
        type: Sequelize.STRING
      },
      cost:{
        type: Sequelize.STRING
      } ,
      sip_code :{
        type: Sequelize.STRING
      },
      sip_reason :{
        type: Sequelize.STRING
      },
      src_user :{
        type: Sequelize.STRING
      },
      dst_user :{
        type: Sequelize.STRING
      },
      sip_reason_crm :{
        type: Sequelize.STRING
      },
      is_treated :{
        type: Sequelize.STRING
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('acc_cdrs');

  }
};
