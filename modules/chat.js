const Mandjou = require("../template/mandjou.json");
const MandjouProduct = require("../template/products.json");
const { SendTextMessage, StopTyping, SendFileMessageImage, SendButtonMessage } = require("./whatsappService");

const { createInvoice } = require("../createInvoice.js");
//let cart = [];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function Chat(response, usermessage, id, client, redisclient, message, cart) {

  Mandjou.forEach(async (data, key) => {
    if (data.answers) {
      for (let i = 0; i < data.answers.length; i++) {
        if (response.intent === data.answers[i] || usermessage.toLowerCase() === data.answer.toLowerCase()) {

          if (data.img) {

            SendFileMessageImage(client, id, data.img, data.question)
              .then(async response => {

                if (response) {
                  if (data.buttons) {

                    await redisclient.set(id+"chat", "reserve")

                    const buttons = []
                    data.buttons.forEach(element => {
                      buttons.push(element)
                    });


                    const buttonMessage = {
                      contentText: data.butonsContent.contentText,
                      footerText: data.butonsContent.footerText,
                      buttons: buttons,
                      headerType: 1
                    }

                    await SendButtonMessage(client, id, buttonMessage)

                  }
                  if (data.products) {
                    data.products.forEach(async product => {

                      await SendFileMessageImage(client, id, product.img, product.text)

                      if (product.buttons) {
                        await redisclient.set(id+"chat", "reserve")

                        const buttons = []
                        product.buttons.forEach(element => {
                          buttons.push(element)
                        });


                        const buttonMessage = {
                          contentText: product.butonsContent.contentText,
                          footerText: product.butonsContent.footerText,
                          buttons: buttons,
                          headerType: 1
                        }

                        await SendButtonMessage(client, id, buttonMessage)

                      }
                      await StopTyping(client, id);

                    })

                  }
                } else {
                  await StopTyping(client, id);
                }
              })
              .catch(async error => {
                await StopTyping(client, id);

              })
          } else {
            SendTextMessage(client, id, data.question)
              .then(async response => {

                if (response) {

                  if (data.products) {
                    data.products.forEach(product => {

                      SendFileMessageImage(client, id, product.img, product.text)
                        .then(async response => {

                          if (response) {
                            if (data.buttons) {

                              await redisclient.set(id+"chat", "reserve")

                              const buttons = []
                              data.buttons.forEach(element => {
                                buttons.push(element)
                              });


                              const buttonMessage = {
                                contentText: data.butonsContent.contentText,
                                footerText: data.butonsContent.footerText,
                                buttons: buttons,
                                headerType: 1
                              }

                              await SendButtonMessage(client, id, buttonMessage)

                            }
                            if (product.buttons) {
                              // await redisclient.set(id+"chat", "reserve")

                              const buttons = []
                              product.buttons.forEach(element => {
                                buttons.push(element)
                              });


                              const buttonMessage = {
                                contentText: product.butonsContent.contentText,
                                footerText: product.butonsContent.footerText,
                                buttons: buttons,
                                headerType: 1
                              }
                              await SendButtonMessage(client, id, buttonMessage)
                              // await sleep(1000);

                            }
                          }
                          await StopTyping(client, id);

                        })
                        .catch(async error => {
                          await StopTyping(client, id);

                        })
                    })

                  }
                } else {
                  await StopTyping(client, id);
                }
              })
              .catch(async error => {
                await StopTyping(client, id);

              })
          }


        }
        break
      }
    }

  })
}


async function AddToCart(response, data, id, client, redisclient, message, cart) {


  if (message.message.buttonsResponseMessage && message.message.buttonsResponseMessage.selectedDisplayText === "COMMANDER") {

    let productsdata = MandjouProduct.filter(dataprodcut => dataprodcut.id.toLowerCase() === message.message.buttonsResponseMessage.selectedButtonId.toLowerCase())
    console.log(productsdata)
    let product = productsdata[0]
    if (product) {
      if (product.id.toLowerCase() === message.message.buttonsResponseMessage.selectedButtonId.toLowerCase()) {
        let quantity = 1

        if (parseInt(data)) {
          quantity = parseInt(data)
        }
        cart.add({
          id:productsdata[0].id,
          name: product.name,
          price: product.price,
          quantity: quantity

        })
      }

      SendTextMessage(client, id, "Le produit à été ajouté à votre panier 🛒")

        .then(async (response) => {

          const buttons = [
            { buttonId: 'id1', buttonText: { displayText: '🛒 Voir Mon panier' }, type: 1 },

          ]

          const buttonMessage = {
            contentText: "Voir mon panier",
            footerText: 'Mon panier',
            buttons: buttons,
            headerType: 1
          }

          await SendButtonMessage(client, id, buttonMessage)
          await StopTyping(client, id);


          const invoice = {
            shipping: {
            },
            items: [],
            subtotal: 0,
            paid: 0,
            invoice_nr: 900
          };
          let shipping = {
            name: id,
            numero: id
          }
          let items = []
          let total = await cart.total()

          Object.assign({}, invoice, { "shipping": shipping });
          let cartdata = await cart.items()

          cartdata.forEach((value) => {
        

              invoice.items.push(
                {
                  item: value.name,
                  description: "value.description",
                  quantity: value.quantity,
                  amount: value.price
                }
              )
             
          })


          invoice.subtotal = total
          invoice.paid = 0
          invoice.invoice_nr = Math.round(Math.random() * 67)

          createInvoice(invoice, `${id}.pdf`);
        })
        .catch((error) => { })

    }
  }


}


module.exports = {
  Chat,
  AddToCart
}