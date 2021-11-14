const mongoose = require('mongoose')



var locationSchema = new mongoose.Schema(
    {
        userid: String,
        longitude: String,
        latitude: String
    },
    { strict: false }
)

module.exports = Location = mongoose.model("locations", locationSchema);