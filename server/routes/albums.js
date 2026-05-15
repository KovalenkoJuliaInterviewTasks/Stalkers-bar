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

// POST / — создать альбом
router.post('/', async (req, res) => {
    try {
        const album = new Album(req.body);
        await album.save();
        res.status(201).json(album);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /:id — обновить альбом (добавить фото)
router.put('/:id', async (req, res) => {
    try {
        const album = await Album.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!album) return res.status(404).json({ error: 'Album not found' });
        res.json(album);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /:id — удалить альбом
router.delete('/:id', async (req, res) => {
    try {
        const album = await Album.findByIdAndDelete(req.params.id);
        if (!album) return res.status(404).json({ error: 'Album not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
