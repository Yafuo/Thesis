const mongoose = require('mongoose');

const parkingSlotSchema = mongoose.Schema({
    userId: String,
    orderNum: Number,
    status: {
        isBooked: Boolean,
        bookedTime: Date
    }
});


module.exports = mongoose.model('parkingslot', parkingSlotSchema);
