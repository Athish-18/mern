import express from 'express';
import { createBrochure, searchTest, askBrochure, checkBrochureExists } from '../controllers/brochure.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = 'uploads/brochures/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

const router = express.Router();

router.post('/create', verifyToken, upload.single('pdfFile'), createBrochure);
router.post('/search-test', searchTest);
router.post('/ask', askBrochure);
router.get('/check/:listingId', checkBrochureExists);

export default router;
