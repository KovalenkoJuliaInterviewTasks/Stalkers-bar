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

// position — index in the items array (0 is the first). Anything out of range
// or not a number means "at the end".
const parsePosition = (position, max) => {
    const index = Number(position);
    if (!Number.isInteger(index) || index < 0) return null;
    return Math.min(index, max);
};

// POST /:sectionId/items — add an item to the section (optionally at index position)
router.post('/:sectionId/items', async (req, res) => {
    try {
        const section = await MenuSection.findOne({ sectionId: req.params.sectionId });
        if (!section) return res.status(404).json({ error: 'Section not found' });
        const { position, ...data } = req.body;
        const index = parsePosition(position, section.items.length);
        if (index === null) section.items.push(data);
        else section.items.splice(index, 0, data);
        await section.save();
        res.status(201).json(section);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /:sectionId/items/:itemId — update an item by _id (optionally move it to position)
router.put('/:sectionId/items/:itemId', async (req, res) => {
    try {
        const section = await MenuSection.findOne({ sectionId: req.params.sectionId });
        if (!section) return res.status(404).json({ error: 'Section not found' });
        const item = section.items.id(req.params.itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        const { position, ...data } = req.body;
        Object.assign(item, data);

        const target = parsePosition(position, section.items.length - 1);
        const current = section.items.findIndex(i => i._id.equals(item._id));
        if (target !== null && target !== current) {
            section.items.splice(current, 1);
            section.items.splice(target, 0, item);
            section.markModified('items');
        }

        await section.save();
        res.json(section);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /:sectionId/items/:itemId/toggle — toggle hidden
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

// DELETE /:sectionId/items/:itemId — delete an item
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
