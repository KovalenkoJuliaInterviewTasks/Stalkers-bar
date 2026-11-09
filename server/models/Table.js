const mongoose = require('mongoose');

// Позиция заказа. Название, литраж и цена копируются из меню в момент
// добавления, чтобы последующие правки меню не меняли уже открытые счета.
const orderLineSchema = new mongoose.Schema({
    menuItemId: { type: mongoose.Schema.Types.ObjectId, default: null }, // null — позиция не из меню
    sectionType: { type: String, enum: ['food', 'bar', 'dessert', 'custom'], required: true },
    station: { type: String, enum: ['kitchen', 'bar', null], default: null }, // куда отправлять; null — никуда
    titleRu: String,
    titleEn: String,
    titleHe: String,
    cap: { type: String, default: '' },          // литраж / вариант, например "1/2 L"
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    sentQty: { type: Number, default: 0, min: 0 }, // сколько штук уже ушло на кухню/бар
    ice: { type: Boolean, default: false },
    comment: { type: String, default: '' },
}, { timestamps: { createdAt: true, updatedAt: false } });

const ticketLineSchema = new mongoose.Schema({
    title: String,
    cap: String,
    qty: Number,
    ice: Boolean,
    comment: String,
}, { _id: false });

// Заказ на кухню / бар. Каждая отправка (в т.ч. дозаказ) — отдельный тикет.
const ticketSchema = new mongoose.Schema({
    station: { type: String, enum: ['kitchen', 'bar'], required: true },
    number: { type: Number, required: true }, // порядковый номер тикета этой станции у стола
    items: [ticketLineSchema],
    done: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false } });

const tableSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    lang: { type: String, enum: ['RU', 'EN', 'HE'], default: 'RU' },
    items: [orderLineSchema],
    tickets: [ticketSchema],
    total: { type: Number, default: 0 },
    closedAt: Date,
    billFile: { type: String, default: null }, // имя файла счёта в server/bills
    billPaper: { type: String, enum: ['58', '80'], default: '58' },
}, { timestamps: true, optimisticConcurrency: true });

module.exports = mongoose.model('Table', tableSchema);
