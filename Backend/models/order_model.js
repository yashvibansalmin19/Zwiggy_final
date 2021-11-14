const mongoose = require('mongoose')



var OrderSchema = new mongoose.Schema(
    {
        user: String,
        restaurents: {
            type: Array,
            "default": []
        },
        products: {
            type: Array,
            "default": []
        },
        price_total: Number
    },
    {strict: false}
)

module.exports = Order = mongoose.model("orders", OrderSchema);