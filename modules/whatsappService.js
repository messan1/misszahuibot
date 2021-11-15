const baileys = require('@adiwajshing/baileys')
const fs = require('fs');

async function SendTextMessage(conn,id,text) {
    return conn.sendMessage(id, text, baileys.MessageType.text)

}
async function SendFileMessageImage(conn,id,file,text) {
  
    return conn.sendMessage(
        id,
        fs.readFileSync(file), 
        baileys.MessageType.image,
        { mimetype: baileys.Mimetype.image, caption: text }
      )
}
async function SendButtonMessage(conn,id,btn) {
    return conn.sendMessage(id, btn, baileys.MessageType.buttonsMessage)

}

async function SendFileMessage(conn,id,file,text) {
    return conn.sendMessage(
        id,
        fs.readFileSync(file), 
        baileys.MessageType.document,
        { mimetype: baileys.Mimetype.pdf, caption: text }
      )
}

async function StartTyping(conn,id) {
    return conn.updatePresence(id, baileys.Presence.composing)

}
async function StopTyping(conn,id) {
    return conn.updatePresence(id, baileys.Presence.paused)

}

module.exports = {
    SendTextMessage,
    SendFileMessageImage,
    SendFileMessage,
    StartTyping, 
    StopTyping,
    SendButtonMessage
}