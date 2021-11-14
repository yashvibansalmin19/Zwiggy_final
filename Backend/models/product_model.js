const mongoose = require('mongoose')



var ProductSchema = new mongoose.Schema(
    {
        uuid: String,
        name: String,
        image: {
            data: Buffer,
            contentType: String
        },
        price: Number,
        restaurant: String
    },
    {strict: false}
)

module.exports = Product = mongoose.model("products", ProductSchema);