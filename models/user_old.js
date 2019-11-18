const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    userSlot: Number,
    userAlarm: String
});

module.exports = mongoose.model('User', userSchema);
