module.exports = (sequelize, Sequelize) => {
    const acc_cdrs = sequelize.define('acc_cdrs', {
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
            },
            is_machine :{
                type: Sequelize.STRING
            },


        },
        {timestamps: false}
    );

    acc_cdrs.prototype.fields = [
        "timestamp" ,
        "context" ,
        "callid" ,
        "callDirection" ,
        "callStatus" ,
        "sipFromURI" ,
        "sipFromTag" ,
        "sipToURI" ,
        "sipToTag" ,
        "hangupCause" ,
        "start_time" ,
        "answerTime" ,
        "end_time" ,
        "durationSec" ,
        "durationMsec" ,
        "privacy" ,
        "failuresipcode" ,
        "failuresipreasonphrase" ,
        "callID" ,
        "custom_vars" ,
        "agent" ,
        "campaignId",
        "eventName" ,
        "memberUUID" ,
        "queueJoinedTime" ,
        "queue" ,
        "side" ,
        "memberSessionUUID",
        "sipFromURI_Dailer",
        "sipFromTag_Dailer",
        "sipToURI_Dailer",
        "sipToTag_Dailer",
        "call_events",
        "debit",
        "cost",
        "sip_code",
        "sip_reason",
        "src_user",
        "dst_user",
        "sip_reason_crm",
        "is_treated",
        "is_machine"

    ];

    return acc_cdrs;

}
