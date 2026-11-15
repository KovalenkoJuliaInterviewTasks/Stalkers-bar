const mongoose = require('mongoose');

// Sales totals for one business day. Individual bills are not stored, only sums.
// There is a single open day: every paid bill is added to it until someone
// presses "Close day" in the admin panel.
const salesDaySchema = new mongoose.Schema({
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    openedAt: { type: Date, default: Date.now }, // first paid bill of the day
    closedAt: Date,
    bar: { type: Number, default: 0 },     // drinks and items not from the menu
    kitchen: { type: Number, default: 0 }, // solid and sweet fuel (food and desserts)
    total: { type: Number, default: 0 },
    bills: { type: Number, default: 0 },   // number of paid bills
}, { timestamps: true });

// At most one open day at a time
salesDaySchema.index({ status: 1 }, { unique: true, partialFilterExpression: { status: 'open' } });
salesDaySchema.index({ closedAt: -1 });

module.exports = mongoose.model('SalesDay', salesDaySchema);
