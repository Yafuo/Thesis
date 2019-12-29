var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const paymentHistorySchema = new Schema({
    _id: Number,
    userId: String,
    email: String,
    stakeTime: Date,
    paidTime: Date,
    extendTime: Date
});