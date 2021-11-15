const addToCart = require('./AddToCart')
const addQuantity = require('./AddQuantity')
const cancel = require('./Cancel')
const confirmation = require('./Confirmation')


async function ActionDetection(response, data, id, client, redisclient) {

    let action = "nothing";
    action = await addToCart(response, data, id, client, redisclient)
    if (action !== "nothing") {
        return action
    }
    action = await addQuantity(response, data, id, client, redisclient)
    if (action !== "nothing") {
        return action
    }
    action = await cancel(response, data, id, client, redisclient)
    if (action !== "nothing") {
        return action
    }
    action = await confirmation(response, data, id, client, redisclient)
    console.log("action",action)

    return action;
}

module.exports = ActionDetection