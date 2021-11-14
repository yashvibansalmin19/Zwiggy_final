const mongoose = require('mongoose')



var RestaurantSchema = new mongoose.Schema(
    {
        uuid: String,
        name: String,
        email: String,
        phone: String,
        longitude: String,
        latitude: String,
        password: String,
        products: {
            type: Array,
            "default": []
        },
        usertype: String
    },
    {strict: false}
)

module.exports = Restaurant = mongoose.model("restaurents", RestaurantSchema);