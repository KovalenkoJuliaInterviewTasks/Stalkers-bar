const express = require('express');
const router = express.Router();
const Performer = require('../models/Performer');

// GET / — все исполнители
router.get('/', async (req, res) => {
    try {
        const performers = await Performer.find().sort('title');
        res.json(performers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST / — создать исполнителя
router.post('/', async (req, res) => {
    try {
        const performer = new Performer(req.body);
        await performer.save();
        res.status(201).json(performer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /:id — обновить исполнителя
router.put('/:id', async (req, res) => {
    try {
        const performer = await Performer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!performer) return res.status(404).json({ error: 'Performer not found' });
        res.json(performer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /:id — удалить исполнителя
router.delete('/:id', async (req, res) => {
    try {
        const performer = await Performer.findByIdAndDelete(req.params.id);
        if (!performer) return res.status(404).json({ error: 'Performer not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
