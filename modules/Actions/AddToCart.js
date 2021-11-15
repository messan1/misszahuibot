 async function AddToCart(response, data, id, client, redisclient){
    if(response.intent==="add.to.cart"){
        return "add.to.cart"
    }
    return "nothing"

}
module.exports = AddToCart