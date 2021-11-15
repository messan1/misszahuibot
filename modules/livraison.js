const { createInvoice } = require("../createInvoice.js");
const { SendTextMessage, SendButtonMessage, SendFileMessage } = require("../modules/whatsappService");
const accountSid = "AC2691907b7c045531e5d60fe356f4fbf5";
const authToken = "315ecdda44ad49ba082503cc17aebe8d";
const twclient = require('twilio')(accountSid, authToken);
let authKeyForDeBings = '07f4ea27ecb8ba5356bd7937a7e740'
const { sendMessage } = require("./Message.js")
const axios = require('axios');

async function Livraison(response, data, id, client, redisclient, message,cart) {

    let cartdata = await cart.items()

    let dataredis = await redisclient.get(id+"chat")

    console.log(dataredis)

    if (response.intent === "facture" || response.intent === "commande") {

        await SendTextMessage(client, id, `Svp envoyez-nous votre adresse de livraison commune suivie des informations supplémentaires`)

    }
    if (dataredis === "livraison") {
        await redisclient.set(id + "chat" + 'lieulivraison', data);

        if (response.intent === "cocody") {
            await SendTextMessage(client, id, `les frais de livraison sont de 1500FCFA`)
            await redisclient.set(id + "chat", "1500")
            await redisclient.set(id + "chat" + "livraison", data)
            await redisclient.set(id + "chat" + 'prixlivraison', "1500");


            Recap(response, data, id, client, redisclient, message, cart)



        } if (response.intent === "hors") {
            await SendTextMessage(client, id, `les frais de livraison sont de 2000FCFA`)
            await redisclient.set(id + "chat" + "livraison", data)

            await redisclient.set(id + "chat", "2000")
            await redisclient.set(id + "chat" + 'prixlivraison', "2000");


            Recap(response, data, id, client, redisclient, message, cart)

        } if (response.intent === "place") {
            await SendTextMessage(client, id, `Pas de livraison ok c'est noté`)
            await redisclient.set(id + "chat" + "livraison", data)

            await redisclient.set(id + "chat", "0")
            await redisclient.set(id + "chat" + 'prixlivraison', "0");


            Recap(response, data, id, client, redisclient, message, cart)

        }
        if (response.intent !== "place" && response.intent !== "hors" && response.intent !== "cocody") {
            await SendTextMessage(client, id, `Entrez votre adresse de livraison svp 😉`)
            const buttons = [
                { buttonId: 'id1', buttonText: { displayText: 'Pas de livraison' }, type: 1 },

            ]

            const buttonMessage = {
                contentText: "Livraison",
                footerText: 'sur place',
                buttons: buttons,
                headerType: 1
            }

            await SendButtonMessage(client, id, buttonMessage)
        }
    }

}


async function Recap(response, data, id, client, redisclient, message, cart) {

    console.log("recap")
    let cartdata = await cart.items()

    let msg = "";
    let total = await cart.total();

    cartdata.forEach((value) => {

        msg = msg + value.name + " x " + value.quantity + "\n"

    })
    

    let livraisonprix = await redisclient.get(id + "chat" + 'prixlivraison');
    let livraisonlieu = await redisclient.get(id + "chat" + 'lieulivraison');


    total = total + parseInt(livraisonprix)

    if (parseInt(livraisonprix) === 0) {
        livraisonlieu = "Sur place"
    }


    await SendTextMessage(client, id, `Le Recap de votre commande\n${msg}\nLieu de Livraison:${livraisonlieu} - prix:${livraisonprix}\ntotal: ${total}FCFA\nConfirmez-vous la commande?`)
    const buttons = [
        { buttonId: 'id1', buttonText: { displayText: '😁 OUI' }, type: 1 },
        { buttonId: 'id2', buttonText: { displayText: '😢 NON' }, type: 1 },

    ]

    await redisclient.set(id + "chat" + 'confirmation', "ok");


    const buttonMessage = {
        contentText: "Confirmation",
        footerText: 'Confirmez votre commande',
        buttons: buttons,
        headerType: 1
    }

    await SendButtonMessage(client, id, buttonMessage)

    await redisclient.set(id + "chat", 'confirmation');

}

async function ValidateMessage(response, data, id, client, redisclient, message,cart) {

    await redisclient.set(id + "chat", "nolivraison")
    let cartdata = await cart.items()

  
    let numero = Math.round(Math.random() * 500)

    let livraisonprix = await redisclient.get(id + "chat" + 'prixlivraison');
    let livraisonlieu = await redisclient.get(id + "chat" + 'lieulivraison');


    const invoice = {
        shipping: {
        },
        items: [],
        subtotal: 0,
        paid: parseInt(livraisonprix),
        invoice_nr: numero
    };
    let shipping = {
        name: id,
        numero: id
    }
    let items = []
    let total = await cart.total();

    Object.assign({}, invoice, { "shipping": shipping });

    cartdata.forEach((value) => {
        if (value._id === id) {

            invoice.items.push(
                {
                    item: value.name,
                    description: "value.description",
                    quantity: value.quantity,
                   
                }
            )
        }

    })



    invoice.subtotal = total
    invoice.paid = parseInt(livraisonprix)
    invoice.invoice_nr = numero

    createInvoice(invoice, `${id}.pdf`);

    setTimeout(async () => {
        await SendFileMessage(client, id, `./${id}.pdf`, "facture")

            .then((result) => {
                //console.log('Result: ', result); //return object success


                SendTextMessage(client, id, `Votre commande à été validé nous vous contacterons pour la livraison et la paiement`)
                    .then(async (result) => {


                        let livraisonplace = await redisclient.get(id + "livraison");



                        let cartdata = await cart.items()

                        let msg = "";
                        let total = await cart.total();
                    
                        cartdata.forEach((value) => {
                    
                            msg = msg + value.name + " x " + value.quantity + "\n"
                    
                        })
                        let livraisonlieu = await redisclient.get(id + 'lieulivraison');

                        for (let i = 0; i < cartdata.length; i++) {
                            let element = cartdata[i];
                            cart.remove(element.item_id)
                            
              
                          }
                      

                        sendMessage(2250789299689, `KIMII.AI vous avez une nouvelle commande N°${numero}\n${msg} du ${id.substring(0, id.length - 15)}\nlieu de livraison:${livraisonlieu}`, 'KIMIIAI', authKeyForDeBings)



            


                    })
                    .catch((erro) => {
                        console.error("Error when sending: ", erro); //return object error
                    });

            })
            .catch((erro) => {
                // console.error('Error when sending: ', erro); //return object error


            });
    }, 1200);
}

module.exports = {
    Livraison,
    ValidateMessage,
    Recap
}