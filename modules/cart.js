const { Livraison } = require("./livraison");
const { SendTextMessage, StopTyping, SendFileMessageImage, SendButtonMessage } = require("./whatsappService");



async function ShowCart(response, data, id, client, redisclient, message,cart) {
    if (response.intent === "panier" || data === "2") {
        let cartdata = await cart.items()

        
        let msg = "";
        let total = await cart.total()

        cartdata.forEach((value) => {
            
                msg = msg + value.name + " x " + value.quantity + "\n"

        })

        await SendTextMessage(client, id, `Votre panier \n ${msg}\ntotal: ${total}FCFA`)
        const buttons = [
            { buttonId: 'id1', buttonText: { displayText: '🎉 Valider ma commande' }, type: 1 },

        ]
        if(total!==0){
            const buttonMessage = {
                contentText: "Valider",
                footerText: 'Valider ma commande',
                buttons: buttons,
                headerType: 1
            }
    
            await SendButtonMessage(client, id, buttonMessage)
        }


    }

    if (response.intent === "facture" || response.intent === "commande") {
        await redisclient.set(id+"chat", "livraison")
        Livraison(response, data, id, client, redisclient, message,cart);

    }
}


module.exports = {
    ShowCart
}