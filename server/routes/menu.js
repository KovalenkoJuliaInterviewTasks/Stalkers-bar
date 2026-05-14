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

module.exports = router;
