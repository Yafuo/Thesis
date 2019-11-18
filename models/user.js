const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    email: String,
    password: String,
    isLinkedToMomo: Boolean
});

module.exports = mongoose.model('User', userSchema);
