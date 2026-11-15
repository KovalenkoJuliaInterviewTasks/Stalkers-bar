const mongoose = require('mongoose');

// Order line. Title, volume and price are copied from the menu when the line
// is added, so later menu edits do not change bills that are already open.
const orderLineSchema = new mongoose.Schema({
    menuItemId: { type: mongoose.Schema.Types.ObjectId, default: null }, // null — item not from the menu
    sectionType: { type: String, enum: ['food', 'bar', 'dessert', 'custom'], required: true },
    station: { type: String, enum: ['kitchen', 'bar', null], default: null }, // where to send it; null — nowhere
    titleRu: String,
    titleEn: String,
    titleHe: String,
    cap: { type: String, default: '' },          // volume / variant, e.g. "1/2 L"
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    sentQty: { type: Number, default: 0, min: 0 }, // how many units were already sent to the kitchen/bar
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

// Kitchen / bar ticket. Every send (including follow-up orders) is a separate ticket.
const ticketSchema = new mongoose.Schema({
    station: { type: String, enum: ['kitchen', 'bar'], required: true },
    number: { type: Number, required: true }, // sequence number of this station's tickets for the table
    cancel: { type: Boolean, default: false }, // true — cancellation of previously sent items
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
    billFile: { type: String, default: null }, // bill file name in server/bills
    billPaper: { type: String, enum: ['58', '80'], default: '58' },
}, { timestamps: true, optimisticConcurrency: true });

module.exports = mongoose.model('Table', tableSchema);
