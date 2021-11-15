// Download the helper library from https://www.twilio.com/docs/node/install
// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = "AC2691907b7c045531e5d60fe356f4fbf5";
const authToken = "315ecdda44ad49ba082503cc17aebe8d";
const client = require('twilio')(accountSid, authToken);

client.messages
  .create({
     body: 'This is the ship that made the Kessel Run in fourteen parsecs?',
     from: '+16018716358',
     to: '+2250585099689'
   })
  .then(message => console.log(message.sid))
  .catch(e => console.log(e))