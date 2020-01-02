const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const userPressedSchema = new Schema({
    _id: Number,
    pressedList: [
        {
            _id: Number,
            status: Number,
            slotId: Number,
            userName: String
        }
    ]
    }
);
module.exports = mongoose.model('UserPressed', userPressedSchema);
