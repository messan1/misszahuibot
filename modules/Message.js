const fetch = require('node-fetch');
let cart = [];

function sendMessage(phoneNumber, messageToSend, senderName, authKey){
    //Définition des différentes variables réquises lors de l'envoie du message
    //L'envoie ne fonctionnera que sous les conditions suivantes:
        // 1- phoneNumber est au format 13 chiffres exemple: 2250708008800
        // 2- senderName est une chaine de caractères sans espaces

    var raw = JSON.stringify({
        "step": null,
        "sender": senderName, // L'ID qui s'affiche sur le téléphone du receveur
        "name": senderName, // Pas trop important, juste une info supplémentaire, mais on choisira le senderName
        "campaignType": "SIMPLE",
        "recipientSource": "CUSTOM",
        "groupId": null,
        "filename": null,
        "saveAsModel": false,
        "destination": "NAT_INTER", //permet d'indiquer
        "message": messageToSend,
        "emailText": null,
        "recipients": [{
            "phone": phoneNumber
        }],
        "sendAt": [],
        "dlrUrl": "",
        "responseUrl": ""
    });

    //Définition des paramètres http à envoyer avec le message
    var requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type':'application/json',
            'Authorization':`Bearer ${authKey}`
        },
        body: raw,
        redirect: 'follow'
      };



    fetch("https://api.letexto.com/v1/campaigns", requestOptions)
      .then(response => response.json())
      .then((result) => {
          let id = result['id']
          let link = `https://api.letexto.com/v1/campaigns/${id}/schedules`
          
        fetch(link, requestOptions)
            .then(response => response.json())
            .then(result => console.log(result))
            .catch(error => console.log('error', error));
        })
      .catch(error => console.log('error', error));
}
module.exports = {
    sendMessage
}