import {UserAgent} from "sip.js";
import fs from 'fs'
import WebSocket from 'ws';

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
let socket = new WebSocket('wss://occ.oxilog.net:2443', [], {
    requestCert: false,
    rejectUnauthorized: false,
    key: fs.readFileSync('/home/oussama/Downloads/privkey.pem', 'utf8'),
    cert: fs.readFileSync('/home/oussama/Downloads/cert.pem', 'utf8'),
    passphrase: fs.readFileSync('/home/oussama/Downloads/chain.pem', 'utf8')

});

const transportOptions = {
    server: "wss://occ.oxilog.net",
    WebSocket: socket
};

const uri = UserAgent.makeURI("sip:2000@occ.oxilog.net");
const userAgentOptions = {
    authorizationPassword: 'pwdpwd2021',
    authorizationUsername: 'mariem',
    reconnectionDelay: 60,
    autoStart: true,
    transportOptions,
    uri,
};

function SipConnect() {
    const userAgent = new UserAgent(userAgentOptions);
    userAgent.start().then(conn => {
    }).catch(err => {
    })
}

SipConnect()
