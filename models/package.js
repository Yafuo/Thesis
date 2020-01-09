const mongoose = require('mongoose');

const packageSchema = mongoose.Schema({
    _id: Number,
    name: String,
    cost: String,
    value: Number
});

module.exports = mongoose.model('Package', packageSchema);
