const { SendTextMessage, StopTyping, SendFileMessageImage,SendButtonMessage } = require("./whatsappService");



async function  Middleware(response, data, id, client, redisclient) {
    let redisdata = await redisclient.get(id)
    if(redisdata!=="nothing"){
        return [true,redisdata]
    }
    return [false,redisdata]
    
}
async function  SetMiddleware(response, data, id, client, redisclient,text) {
   await redisclient.set(id+"chat",text)

}

module.exports = {
    Middleware,
    SetMiddleware
}