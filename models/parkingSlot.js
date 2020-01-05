var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const parkingSlotSchema = new Schema({
        _id: Number,
        stationAddress: String,
        capacity: Number,
        lat: Number,
        lon: Number,
        slots: [
            {
                _id: Number,
                future: [
                    {
                        _id: String,
                        userName: String,
                        status: String,
                        startTime: Date,
                        package: Number,
                        endTime: Date
                    }
                ]
            }
        ]
    }
);
module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
