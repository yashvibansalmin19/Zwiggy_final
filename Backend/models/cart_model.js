const mongoose = require('mongoose')



var CartSchema = new mongoose.Schema(
    {
        user: String,
        products: {
            type: Array,
            "default": []
        },
        price_total: Number
    },
    {strict: false}
)

module.exports = Cart = mongoose.model("carts", CartSchema);