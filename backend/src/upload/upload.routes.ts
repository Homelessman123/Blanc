import { Router } from 'express';
import { uploadGif, getUserGifs, deleteGif, upload, uploadMedia, uploadMediaToAppsScript } from './upload.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Upload GIF
router.post('/gif', protect, upload.single('gif'), uploadGif);

// Upload media to Google Drive via Apps Script
router.post('/media', protect, uploadMedia.single('file'), uploadMediaToAppsScript);

// Get user's uploaded GIFs
router.get('/gifs', protect, getUserGifs);

// Delete GIF
router.delete('/gif/:filename', protect, deleteGif);

export default router;
