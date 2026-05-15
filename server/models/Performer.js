const mongoose = require('mongoose');

const performerSchema = new mongoose.Schema({
    title: String,
    image: String,
    descEn: String,
    descRu: String,
    descHe: String
});

module.exports = mongoose.model('Performer', performerSchema);
