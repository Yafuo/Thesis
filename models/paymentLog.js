var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const paymentLogSchema = new Schema({
    _id: Number,
    userName: String,
    actionName: String,
    amount: String,
    time: Date
});