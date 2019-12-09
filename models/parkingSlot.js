var mongoose = require('mongoose');

const parkingSlotSchema = mongoose.Schema([{
    _id: Object,
    parkingAddress: String,
    current: {
        userName: String,
        status: String,
        startTime: Date,
        package: Number,
        endTime: Date
    },
    future: [
        {
            userName: String,
            status: String,
            startTime: Date,
            package: Number,
            endTime: Date
        }
    ]
}]);