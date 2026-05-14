const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
    titleEn: String,
    titleRu: String,
    titleHe: String,
    date: String,
    items: [String],
    order: { type: Number, default: 0 }
});

module.exports = mongoose.model('Album', albumSchema);
