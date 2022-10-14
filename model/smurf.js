const mongoose = require('mongoose');
const { Schema } = mongoose;

const SchtroumpfsSchema = new Schema({
    nom: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    friends: {
        type: Array
    }
})

const Schtroumpfs = mongoose.model("Schtroumpfs", SchtroumpfsSchema);
module.exports = Schtroumpfs