const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    titleEn: String,
    titleRu: String,
    titleHe: String,
    descEn: String,
    descRu: String,
    descHe: String,
    image: String,
    cost1: Number,
    cost2: Number,
    cap1: String,
    cap2: String,
    hidden: { type: Boolean, default: false }
});

const menuSectionSchema = new mongoose.Schema({
    sectionId: { type: String, required: true },
    type: { type: String, enum: ['food', 'bar', 'dessert'], required: true },
    titleEn: String,
    titleRu: String,
    titleHe: String,
    order: { type: Number, default: 0 },
    items: [menuItemSchema]
});

module.exports = mongoose.model('MenuSection', menuSectionSchema);
