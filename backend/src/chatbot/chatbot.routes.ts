import { Router } from 'express';
import { sendMessage, getSuggestions, getTechFields } from './chatbot.controller';
import { optionalAuth } from '../middleware/optionalAuth.middleware';

const router = Router();

// Optional auth - works for both logged in and anonymous users
router.post('/message', optionalAuth, sendMessage);
router.get('/suggestions', optionalAuth, getSuggestions);
router.get('/tech-fields', getTechFields);

export default router;
