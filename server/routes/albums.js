const express = require('express');
const router = express.Router();
const Album = require('../models/Album');

router.get('/', async (req, res) => {
    try {
        const albums = await Album.find().sort({ date: -1 });
        res.json(albums);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
