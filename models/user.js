const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    email: String,
    password: String,
    lang: {type: String, default: 'vn'},
    status: {type: String, default: 'none'}
});

module.exports = mongoose.model('User', userSchema);
