const express = require('express');
const router = express.Router();
const SalesDay = require('../models/SalesDay');

const round = (n) => Math.round(n * 100) / 100;

// Bar and kitchen sums of a paid table. Lines without a station (old custom items
// created with "send nowhere") count as bar, like all new custom items.
const tableSums = (table) => {
    let bar = 0;
    let kitchen = 0;
    for (const line of table.items) {
        const sum = line.price * line.qty;
        if (line.station === 'kitchen') kitchen += sum;
        else bar += sum;
    }
    return { bar: round(bar), kitchen: round(kitchen), total: round(bar + kitchen) };
};

// Add a paid table to the current (open) day; the day is created by its first bill.
const addPaidTable = async (table) => {
    const { bar, kitchen, total } = tableSums(table);
    const update = {
        $inc: { bar, kitchen, total, bills: 1 },
        $setOnInsert: { openedAt: new Date() },
    };
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            return await SalesDay.findOneAndUpdate({ status: 'open' }, update, { upsert: true, new: true });
        } catch (err) {
            // two bills created the open day at the same time — the second one just retries
            if (err.code !== 11000) throw err;
        }
    }
    return SalesDay.findOneAndUpdate({ status: 'open' }, update, { new: true });
};

// GET / — current day and closed days (newest first)
router.get('/', async (req, res) => {
    try {
        const [current, days] = await Promise.all([
            SalesDay.findOne({ status: 'open' }).lean(),
            SalesDay.find({ status: 'closed' }).sort({ closedAt: -1 }).limit(1000).lean(),
        ]);
        res.json({ current, days });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /close-day — close the current day and keep its totals
router.post('/close-day', async (req, res) => {
    try {
        const day = await SalesDay.findOneAndUpdate(
            { status: 'open' },
            { $set: { status: 'closed', closedAt: new Date() } },
            { new: true },
        );
        if (!day) return res.status(400).json({ error: 'С момента закрытия прошлого дня оплаченных счетов не было' });
        res.json(day);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
module.exports.addPaidTable = addPaidTable;
