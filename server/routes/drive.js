const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const upload = multer({ storage: multer.memoryStorage() });

// POST /upload — загрузить файл в Cloudinary
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            return res.status(500).json({ error: 'Cloudinary credentials are not set in environment variables' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        // folderId используется как папка в Cloudinary
        const folder = req.body.folderId || 'stalkers-bar';

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder, resource_type: 'image' },
                (error, result) => error ? reject(error) : resolve(result)
            );
            stream.end(req.file.buffer);
        });

        res.json({ fileId: result.secure_url, url: result.secure_url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
