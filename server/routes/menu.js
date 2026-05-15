const express = require('express');
const router = express.Router();
const MenuSection = require('../models/MenuSection');

router.get('/:type', async (req, res) => {
    try {
        const sections = await MenuSection.find({ type: req.params.type }).sort('order');
        res.json(sections);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /:sectionId/items — добавить item в секцию
router.post('/:sectionId/items', async (req, res) => {
    try {
        const section = await MenuSection.findOne({ sectionId: req.params.sectionId });
        if (!section) return res.status(404).json({ error: 'Section not found' });
        section.items.push(req.body);
        await section.save();
        res.status(201).json(section);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /:sectionId/items/:itemId — обновить item по _id
router.put('/:sectionId/items/:itemId', async (req, res) => {
    try {
        const section = await MenuSection.findOne({ sectionId: req.params.sectionId });
        if (!section) return res.status(404).json({ error: 'Section not found' });
        const item = section.items.id(req.params.itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        Object.assign(item, req.body);
        await section.save();
        res.json(section);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /:sectionId/items/:itemId/toggle — переключить hidden
router.patch('/:sectionId/items/:itemId/toggle', async (req, res) => {
    try {
        const section = await MenuSection.findOne({ sectionId: req.params.sectionId });
        if (!section) return res.status(404).json({ error: 'Section not found' });
        const item = section.items.id(req.params.itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        item.hidden = !item.hidden;
        await section.save();
        res.json(section);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /:sectionId/items/:itemId — удалить item
router.delete('/:sectionId/items/:itemId', async (req, res) => {
    try {
        const section = await MenuSection.findOne({ sectionId: req.params.sectionId });
        if (!section) return res.status(404).json({ error: 'Section not found' });
        const item = section.items.id(req.params.itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        item.deleteOne();
        await section.save();
        res.json(section);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
