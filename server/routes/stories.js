const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const auth = require('../middleware/auth');

// Create a new story
router.post('/', auth, storyController.createStory);

// Get all stories for the feed
router.get('/', auth, storyController.getStories);

// Get stories for a specific user
router.get('/user/:userId', storyController.getUserStories);

// Mark story as viewed
router.post('/:storyId/view', auth, storyController.viewStory);

// Delete a story
router.delete('/:storyId', auth, storyController.deleteStory);

// Get story analytics
router.get('/:storyId/analytics', auth, storyController.getStoryAnalytics);

module.exports = router; 