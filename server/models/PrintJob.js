const mongoose = require('mongoose');

// Print job for the print-agent running on the bar computer.
// role — which printer must print it: kitchen, bar or bills.
const printJobSchema = new mongoose.Schema({
    role: { type: String, enum: ['kitchen', 'bar', 'bills'], required: true },
    kind: { type: String, enum: ['ticket', 'bill'], required: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    ticketId: { type: mongoose.Schema.Types.ObjectId, default: null },
    label: String, // shown in the problems list, e.g. "Кухня №2 — стол 5"
    status: {
        type: String,
        enum: ['pending', 'printing', 'done', 'error', 'expired', 'cancelled'],
        default: 'pending',
        index: true,
    },
    attempts: { type: Number, default: 0 },
    queuedAt: { type: Date, default: Date.now },   // job expiry is counted from this time
    nextTryAt: { type: Date, default: Date.now },
    claimedAt: Date,
    printedAt: Date,
    printerName: String,
    error: String,
}, { timestamps: true });

module.exports = mongoose.model('PrintJob', printJobSchema);
