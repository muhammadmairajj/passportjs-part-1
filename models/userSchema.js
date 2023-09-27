const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String
    },
    username: {
        type: String,
        unique: true,
    },
    password: {
        type: String
    }
})

const User = mongoose.model("users", userSchema);

module.exports = User;