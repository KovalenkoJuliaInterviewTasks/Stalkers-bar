const mongoose = require('mongoose');

// Задание печати для программы-посредника (print-agent) на компьютере в баре.
// role — какой принтер должен его напечатать: кухня, бар или касса (счета).
const printJobSchema = new mongoose.Schema({
    role: { type: String, enum: ['kitchen', 'bar', 'bills'], required: true },
    kind: { type: String, enum: ['ticket', 'bill'], required: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    ticketId: { type: mongoose.Schema.Types.ObjectId, default: null },
    label: String, // для списка проблем: «Кухня №2 — стол 5»
    status: {
        type: String,
        enum: ['pending', 'printing', 'done', 'error', 'expired', 'cancelled'],
        default: 'pending',
        index: true,
    },
    attempts: { type: Number, default: 0 },
    queuedAt: { type: Date, default: Date.now },   // от него считается срок годности задания
    nextTryAt: { type: Date, default: Date.now },
    claimedAt: Date,
    printedAt: Date,
    printerName: String,
    error: String,
}, { timestamps: true });

module.exports = mongoose.model('PrintJob', printJobSchema);
