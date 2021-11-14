const mongoose = require('mongoose')



var UserSchema = new mongoose.Schema(
    {
        uuid: String,
        email: String,
        password: String,
        usertype: String
    },
    {strict: false}
)

module.exports = User = mongoose.model("users", UserSchema);