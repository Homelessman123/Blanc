import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { getMyRegistrations, getMyCalendarEvents, getMyStreak, searchUsers, getTeammateRecommendationsController, createCalendarEvent } from './user.controller';

const router = express.Router();

// @route   GET /api/users/registrations
// @desc    Get current user's registered contests
// @access  Private
router.get('/registrations', protect, getMyRegistrations);

// @route   GET /api/users/calendar-events
// @desc    Get current user's calendar events
// @access  Private
router.get('/calendar-events', protect, getMyCalendarEvents);
router.post('/calendar-events', protect, createCalendarEvent);

// @route   GET /api/users/streak
// @desc    Get current user's streak data
// @access  Private
router.get('/streak', protect, getMyStreak);
router.get('/search', protect, searchUsers);
// @route   GET /api/users/recommendations
// @desc    Get teammate recommendations for the current user
// @access  Private
router.get('/recommendations', protect, getTeammateRecommendationsController);

export default router;
