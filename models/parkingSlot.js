var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const parkingSlotSchema = new Schema([
    {
        _id: Number,
        stationAddress: String,
        slots: [
            {
                slotId: Number,
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
            }
        ]
    }
]);
module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);