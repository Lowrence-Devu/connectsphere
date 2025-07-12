const Story = require('../models/Story');
const User = require('../models/User');
const notify = require('../utils/notify');

// Create a new story
const createStory = async (req, res) => {
  try {
    const { media, mediaType, caption } = req.body;
    const userId = req.user._id;

    const story = new Story({
      author: userId,
      media,
      mediaType: mediaType || 'image',
      caption,
    });

    await story.save();

    // Populate author details
    await story.populate('author', 'username profileImage');

    res.status(201).json(story);
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ message: 'Failed to create story' });
  }
};

// Get all active stories for the feed
const getStories = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    // Get stories from users the current user follows + their own stories
    const followingIds = [...user.following, userId];
    
    const stories = await Story.find({
      author: { $in: followingIds },
      isActive: true,
      expiresAt: { $gt: new Date() }
    })
    .populate('author', 'username profileImage')
    .populate('views.user', 'username profileImage')
    .sort({ createdAt: -1 });

    // Group stories by author
    const groupedStories = stories.reduce((acc, story) => {
      const authorId = story.author._id.toString();
      if (!acc[authorId]) {
        acc[authorId] = {
          author: story.author,
          stories: []
        };
      }
      acc[authorId].stories.push(story);
      return acc;
    }, {});

    res.json(Object.values(groupedStories));
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ message: 'Failed to fetch stories' });
  }
};

// Get stories for a specific user
const getUserStories = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const stories = await Story.find({
      author: userId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    })
    .populate('author', 'username profileImage')
    .populate('views.user', 'username profileImage')
    .sort({ createdAt: -1 });

    res.json(stories);
  } catch (error) {
    console.error('Get user stories error:', error);
    res.status(500).json({ message: 'Failed to fetch user stories' });
  }
};

// Mark story as viewed
const viewStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user._id;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user already viewed this story
    const alreadyViewed = story.views.some(view => 
      view.user.toString() === userId.toString()
    );

    if (!alreadyViewed) {
      story.views.push({ user: userId });
      await story.save();
    }

    res.json({ message: 'Story viewed' });
  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({ message: 'Failed to mark story as viewed' });
  }
};

// Delete a story
const deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user._id;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user owns the story
    if (story.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this story' });
    }

    await Story.findByIdAndDelete(storyId);
    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ message: 'Failed to delete story' });
  }
};

// Get story analytics (for story author)
const getStoryAnalytics = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user._id;

    const story = await Story.findById(storyId).populate('views.user', 'username profileImage');
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user owns the story
    if (story.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to view analytics' });
    }

    const analytics = {
      totalViews: story.views.length,
      viewers: story.views,
      reachPercentage: story.views.length / 100, // Simple calculation
      createdAt: story.createdAt,
      expiresAt: story.expiresAt
    };

    res.json(analytics);
  } catch (error) {
    console.error('Get story analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch story analytics' });
  }
};

module.exports = {
  createStory,
  getStories,
  getUserStories,
  viewStory,
  deleteStory,
  getStoryAnalytics
}; 