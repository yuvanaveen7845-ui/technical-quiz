const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

router.post('/upload', authenticateToken, isAdmin, upload.single('image'), (req, res) => {
    if (req.file) {
        res.json({ url: `http://localhost:5000/uploads/${req.file.filename}` });
    } else {
        res.status(400).json({ message: 'No file uploaded' });
    }
});

module.exports = router;
