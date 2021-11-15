const { Middleware, SetMiddleware } = require("../../modules/middleware")



async function Cancel(response, data, id, client, redisclient){
    
    let middleware = await Middleware(response, data, id, client, redisclient)
    let stop = middleware[0]
    let stopdata = middleware[0]
    
    if(response.intent === "non" && stopdata === "confirmation"){
        return "cancel"
    }
    return "nothing"

}

module.exports = Cancel