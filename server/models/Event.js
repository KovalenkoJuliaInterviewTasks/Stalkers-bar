const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: String,
    image: String,
    descEn: String,
    descRu: String,
    descHe: String,
    date: String,
    open: String,
    start: String,
    price: Number,
    order: { type: Number, default: 0 },
    performerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Performer' }
});

module.exports = mongoose.model('Event', eventSchema);
