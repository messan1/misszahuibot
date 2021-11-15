const { Middleware, SetMiddleware } = require("../../modules/middleware")


 async function AddQuantity(response, data, id, client, redisclient){
    let middleware = await Middleware(response, data, id, client, redisclient)
    let stop = middleware[0]
    let stopdata = middleware[0]

    if( stopdata === "quantity" && stop){
        return "add.quantity"
    }
    return "nothing"
}


module.exports = AddQuantity