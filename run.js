const Mandjou = require("./template/mandjou.json");
const { NlpManager } = require('node-nlp');
const { Chat, AddToCart } = require("./modules/chat.js");
const { SendTextMessage, StartTyping, SendFileMessageImage } = require("./modules/whatsappService");
const { Livraison, ValidateMessage, Recap } = require("./modules/livraison.js");
const { ShowCart } = require("./modules/cart")
const ActionDetection = require("./modules/Actions")
const { Train } = require("./modules/Ia.js")
const baileys = require('@adiwajshing/baileys')
const fs = require('fs');
const { QRCodeSVG } = require('@cheprasov/qrcode');
const sharp = require("sharp")
const MandjouProduct = require("./template/products.json");
const { Cart } = require('@timbouc/cart');
const Redis = require("ioredis");
const { v4: uuidv4 } = require('uuid');
const { RedisStorage } = require('./redisStorage')


const redis = new  Redis(6379, "redishost");



//declare
const manager = new NlpManager({ languages: ['fr'], forceNER: true });


(async () => {

  Mandjou.forEach((data) => {
    if (data.trainings) {
      data.trainings.forEach((train) => {
        if (train.phrases) {
          train.phrases.forEach((phr) => {
            manager.addDocument('fr', phr, train.keyword);
          })
        }
      })
    }
  })
  Train(manager)
  await manager.train();
  manager.save();

  connectToWhatsApp()
})();




async function connectToWhatsApp() {
  const conn = new baileys.WAConnection()
  conn.version = [2, 2140, 12]

  if (fs.existsSync('./client.json')) {

    conn.loadAuthInfo('./client.json')

  } else {
    conn.on('open', () => {
      console.log(`credentials updated!`)
      const authInfo = conn.base64EncodedAuthInfo()
      fs.writeFileSync('./client.json', JSON.stringify(authInfo, null, '\t'))
    })
  }
  conn.on('qr', async data => {


    const qrSVG = new QRCodeSVG(data, {
      level: 'Q',
      image: {
        source: 'kimi.png',
        width: '35%',
        height: '35%',
        x: 'center',
        y: 'center',
      },
    });


    fs.writeFile('./qr.svg', qrSVG.toString(), function (err) {
      if (err) return console.log(err);

    });



  })

  await conn.connect()
  start(conn)

}



async function start(client) {

  client.on('chat-update', async chatUpdate => {
    if (chatUpdate.messages && chatUpdate.count) {
      const messages = chatUpdate.messages.all()
      messages.forEach(async message => {


        let id = message.key.remoteJid

        const cart = new Cart(id, {
          default: 'redis',
          storages: {
            redis: {
              driver: "redis",
              config: {
                prefix: process.env.REDIS_PREFIX || "cart",
                host: process.env.REDIS_HOST || "redishost",
                password: process.env.REDIS_PASSWORD,
                port: process.env.REDIS_PORT || 6379
              }
            }
          }
        })
        cart.registerDriver('redis', RedisStorage)


        let response = ""
        //User messages
        let data = ""
        if (message.message.conversation) {
          data = message.message.conversation
          response = await manager.process('fr', data);

        } else if (message.message.buttonsResponseMessage && message.message.buttonsResponseMessage.selectedDisplayText !== "COMMANDER") {
          data = message.message.buttonsResponseMessage.selectedDisplayText
          response = await manager.process('fr', data);
        } else if (message.message.extendedTextMessage && message.message.extendedTextMessage && message.message.extendedTextMessage.contextInfo.quotedMessage && message.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage.caption) {

          data = message.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage.caption
        }

        if (message.message.buttonsResponseMessage && message.message.buttonsResponseMessage.selectedButtonId) {
          AddToCart(response, data, id, client, redis, message, cart);

        }



        if (!message.participant) {
          await StartTyping(client, id);
          let redisdata = await redis.get(id)
          let recap = await redis.get(id + 'confirmation');

          let action = await ActionDetection(response, data, id, client, redis)
          if (redisdata === "livraison") {
            Livraison(response, data, id, client, redis, message);
          }

          if (response.intent === "oui" && redisdata === "confirmation") {
            ValidateMessage(response, data, id, client, redis, message)
            await redis.set(id + "chat" + 'confirmation', "finish");

          }
          if (response.intent === "reset") {
            let cartdata = await cart.items()
            for (let i = 0; i < cartdata.length; i++) {
              let element = cartdata[i];
              cart.remove(element.item_id)
              

            }


            await SendTextMessage(client, id, `😭 Vous avez annulé la commande`)

            await redis.set(id + "chat", 'nothing');
            await redis.set(id + "chat" + 'confirmation', "finish");
          }
          if (response.intent === "non" && redisdata === "confirmation") {

            await SendTextMessage(client, id, `😭 Vous avez annulé la commande`)
            await redis.set(id + "chat", 'nothing');
            await redis.set(id + "chat" + 'confirmation', "finish");

          }
          if (response.intent !== "non" && response.intent !== "oui" && redisdata === "confirmation") {
            await Recap(response, data, id, client, redis, message)

            await SendTextMessage(client, id, `Confirmez-vous la commande?`)

          }
          if (redisdata === "livraison" && recap === "ok") {
            await SendTextMessage(client, id, `🤧 Vous n'avez pas d'adresse de livraison? pour cette commande?\n`)
            await Recap(response, data, id, client, redis, message)
          }
          
          if (redisdata !== "confirmation" && redisdata !== "livraison") {
            Chat(response, data, id, client, redis, message, cart);
            ShowCart(response, data, id, client, redis, message, cart);
          }

          if (data.match(/[+]+[a-zA-Z0-9]{1,2}/gi)) {
            let product = data.match(/[+]+[a-zA-Z0-9]{1,2}/gi)[0]
            product = product.slice(1, product.length)
            let cartdata = await cart.items()
            cartdata.forEach(async (value) => {
              if (product.toLowerCase() === value.id.toLowerCase()) {
                cart.add({
                  id: value.id,
                  name: value.name,
                  price: value.price,
                  quantity: 1

                })
                await SendTextMessage(client, id, `Vous panier à été mis à jour\n`)
              }else{
                await SendTextMessage(client, id, `Ce produit n'existe pas dans votre panier\n`)
              }
            })

          }
          if (data.match(/[-]+[a-zA-Z0-9]{1,2}/gi)) {
            let product = data.match(/[-]+[a-zA-Z0-9]{1,2}/gi)[0]
            product = product.slice(1, product.length)
            let cartdata = await cart.items()

            for (let i = 0; i < cartdata.length; i++) {
              if (product.toLowerCase() === cartdata[i].id.toLowerCase()) {
                if (cartdata[i].quantity > 1) {
                  cart.update(cartdata[i].item_id, {
                    quantity: {
                      relative: false,
                      value: cartdata[i].quantity-1
                  }
                  })
                  await SendTextMessage(client, id, `Vous panier à été mis à jour\n`)
                  break
                }
                if (cartdata[i].quantity < 1) {
                  cart.remove(cartdata[i].item_id,)
                  await SendTextMessage(client, id, `Vous panier à été mis à jour\n`)
                  break
                }
                if (cartdata[i].quantity === 1) {
                  cart.remove(cartdata[i].item_id,)
                  await SendTextMessage(client, id, `Vous panier à été mis à jour\n`)
                  break
                }

              }else{
                await SendTextMessage(client, id, `Ce produit n'existe pas dans votre panier\n`)
              }
            }

          }


          if (action === "not.found") {
            await SendTextMessage(client, id, `j'ai pas compris votre message`)
          }
        }



      })
    }
  })


}





