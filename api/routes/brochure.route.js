import express from 'express';
import { createBrochure } from '../controllers/brochure.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.post('/create', verifyToken, createBrochure);

export default router;
