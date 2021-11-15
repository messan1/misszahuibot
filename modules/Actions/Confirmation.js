const { Middleware, SetMiddleware } = require("../../modules/middleware")



async function Confirmation(response, data, id, client, redisclient){
    let middleware = await Middleware(response, data, id, client, redisclient)
    let stop = middleware[0]
    let stopdata = middleware[0]

    if(!["oui", "non"].includes(response.intent) && stopdata === "confirmation" && stop){
        return "confirmation"
    }
    return "nothing"

}

module.exports = Confirmation