const { createInvoice } = require("../createInvoice.js");
const { SendTextMessage, StartTyping } = require("../modules/whatsappService");


let cart = [];
const axios = require('axios');

async function Livraison(response, data, id, client, redisclient, message) {

    let datalivraison = await redisclient.get(id)

    if (response.intent === "facture" || response.intent === "commande") {

        await SendTextMessage(client, id, `Svp envoyez-nous votre adresse de livraison commune suivie des informations supplémentaires`)
       
    }
    if (data === "livraison") {
        await redisclient.set(id+"chat" + 'lieulivraison', data);

        if (response.intent === "cocody") {
            await SendTextMessage(client, id, `les frais de livraison sont de 1500FCFA`)
            await redisclient.set(id+"chat", "1500")
            await redisclient.set(id+"chat" + "livraison", data)
            await redisclient.set(id+"chat" + 'prixlivraison', "1500");


        await Recap(response, data, id, client, redisclient, message)



        } if (response.intent === "hors") {
            await SendTextMessage(client, id, `les frais de livraison sont de 2000FCFA`)
            await redisclient.set(id+"chat" + "livraison", data)
            await redisclient.set(id+"chat", "2000")
            await redisclient.set(id+"chat" + 'prixlivraison', "2000");
        await Recap(response, data, id, client, redisclient, message)

        }
    }

}


async function Recap(response, data, id, client, redisclient, message) {

    let cartdata = await redisclient.get('cart');
    cart = JSON.parse(cartdata)
    let msg = "";
    let total = 0;
    cart.forEach((value) => {
        if(value._id === id){
            msg = msg + value.item + " x " + value.quantity + "\n"
            total = total + value.amount
        }

    })

    let livraisonprix = await redisclient.get(id + 'prixlivraison');
    let livraisonlieu = await redisclient.get(id + 'lieulivraison');


    total = total + parseInt(livraisonprix)


    await SendTextMessage(client, id, `Le Recap de votre commande\n${msg}\nLieu de Livraison:${livraisonlieu} - prix:${livraisonprix}\ntotal: ${total}FCFA\nConfirmez-vous la commande?`)
    await redisclient.set(id+"chat" , 'confirmation');

}

async function ValidateMessage(response, data, id, client, redisclient, message) {
   
    await redisclient.set(id+"chat", "nolivraison")
    let cartdata = await redisclient.get('cart');
    cart = JSON.parse(cartdata)
    let livraisonprix = await redisclient.get(id + 'prixlivraison');
    let livraisonlieu = await redisclient.get(id + 'lieulivraison');


    const invoice = {
        shipping: {
        },
        items: [],
        subtotal: 0,
        paid: parseInt(livraisonprix),
        invoice_nr: 900
    };
    let shipping = {
        name: id,
        numero: id
    }
    let items = []
    let total = 0;

    Object.assign({}, invoice, { "shipping": shipping });

    cart.forEach((value) => {
        if (value._id === id) {

            invoice.items.push(
                {
                    item: value.item,
                    description: value.description,
                    quantity: value.quantity,
                    amount: value.amount
                }
            )
        }
        total = total + value.amount

    })


    invoice.subtotal = total
    invoice.paid = parseInt(livraisonprix)
    invoice.invoice_nr = Math.round(Math.random() * 67)

    createInvoice(invoice, `${id}.pdf`);

    setTimeout(() => {

        client
            .sendFile(
                id,
                `./${id}.pdf`,
                "facture",
                "facture",
            )
            .then((result) => {
                //console.log('Result: ', result); //return object success
                client.stopTyping(id);

                client
                    .sendText(id, `Votre commande à été validé vous pouvez payer par ORANGE MONEY sur ce numéro pour valider la commande `)
                    .then(async (result) => {

                        client.stopTyping(id);
                        let livraisonplace = await redisclient.get(id + "livraison");



                        client.stopTyping(id);
                        let temp = []
                        let msg = "";

                        cart.forEach((value) => {
                            if (value._id !== id) {
                                temp.push(value)
                            } if (value._id === id) {
                                msg = msg + value.item + " x " + value.quantity + "\n"
                            }

                        })
                        let livraisonlieu = await redisclient.get(id + 'lieulivraison');
                    
                        cart = temp
                        await redisclient.set('cart', JSON.stringify(temp));


                        client
                            .sendText(id, `Nous vous contacterons pour la livraison de vos biscuits`)
                            .then((result) => {

                                client.stopTyping(id);

                            })
                            .catch((erro) => {
                                console.error("Error when sending: ", erro); //return object error
                            });

                    })
                    .catch((erro) => {
                        console.error("Error when sending: ", erro); //return object error
                    });

            })
            .catch((erro) => {
                // console.error('Error when sending: ', erro); //return object error
                client.stopTyping(id);

            });
    }, 1200);
}

module.exports = {
    Livraison,
    ValidateMessage,
    Recap
}