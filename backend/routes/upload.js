const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { requireAuth, requireRND } = require('../middleware/auth');

// Configure multer for file uploads
// Resolve upload base directory from env or default
const UPLOAD_BASE = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { type = 'general' } = req.body;
        const uploadPath = path.join(UPLOAD_BASE, type);

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/\s/g, '-');
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// Upload single image
router.post('/image', requireAuth, requireRND, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { type = 'general' } = req.body;
        const filePath = `/uploads/${type}/${req.file.filename}`;

        // Store in database
        const result = await db.query(
            `INSERT INTO media_files (filename, file_path, file_type, uploaded_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [req.file.filename, filePath, req.file.mimetype, req.user.id]
        );

        // Log activity
        await db.query(
            'INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'UPLOAD_IMAGE', 'media_file', result.rows[0].id, JSON.stringify({ filename: req.file.filename })]
        );

        res.json({
            message: 'File uploaded successfully',
            file: {
                id: result.rows[0].id,
                filename: req.file.filename,
                path: filePath,
                url: filePath,
                type: req.file.mimetype,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
});

// Upload multiple images
router.post('/images', requireAuth, requireRND, upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const { type = 'general' } = req.body;
        const uploadedFiles = [];

        for (const file of req.files) {
            const filePath = `/uploads/${type}/${file.filename}`;

            // Store in database
            const result = await db.query(
                `INSERT INTO media_files (filename, file_path, file_type, uploaded_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
                [file.filename, filePath, file.mimetype, req.user.id]
            );

            uploadedFiles.push({
                id: result.rows[0].id,
                filename: file.filename,
                path: filePath,
                url: filePath,
                type: file.mimetype,
                size: file.size
            });

            // Log activity
            await db.query(
                'INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)',
                [req.user.id, 'UPLOAD_IMAGE', 'media_file', result.rows[0].id, JSON.stringify({ filename: file.filename })]
            );
        }

        res.json({
            message: `${uploadedFiles.length} files uploaded successfully`,
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
});

// Upload from base64 (for clipboard paste)
router.post('/base64', requireAuth, requireRND, async (req, res) => {
    try {
        const { image, type = 'general', filename = 'pasted-image' } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image data provided' });
        }

        // Extract base64 data
        const matches = image.match(/^data:image\/([a-zA-Z]*);base64,([^\"]*)/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ error: 'Invalid base64 image data' });
        }

        const imageType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileName = `${filename}-${uniqueSuffix}.${imageType}`;

        // Create directory if it doesn't exist
        const uploadPath = path.join(UPLOAD_BASE, type);
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        // Write file
        const filePath = path.join(uploadPath, fileName);
        fs.writeFileSync(filePath, buffer);

        const relativeFilePath = `/uploads/${type}/${fileName}`;

        // Store in database
        const result = await db.query(
            `INSERT INTO media_files (filename, file_path, file_type, uploaded_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [fileName, relativeFilePath, `image/${imageType}`, req.user.id]
        );

        // Log activity
        await db.query(
            'INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'UPLOAD_IMAGE', 'media_file', result.rows[0].id, JSON.stringify({ filename: fileName, source: 'clipboard' })]
        );

        res.json({
            message: 'File uploaded successfully from clipboard',
            file: {
                id: result.rows[0].id,
                filename: fileName,
                path: relativeFilePath,
                url: relativeFilePath,
                type: `image/${imageType}`,
                size: buffer.length
            }
        });
    } catch (error) {
        console.error('Base64 upload error:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
});

module.exports = router;
