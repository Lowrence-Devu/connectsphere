import React, { useState, useEffect, useRef } from 'react';

const Stories = ({ 
  stories, 
  onStoryView, 
  onCreateStory, 
  onDeleteStory,
  user,
  onNavigateToProfile
}) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentAuthorIndex, setCurrentAuthorIndex] = useState(0);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [viewedStories, setViewedStories] = useState(new Set());
  const progressRef = useRef(null);
  const timeoutRef = useRef(null);

  // Auto-advance stories
  useEffect(() => {
    if (showStoryViewer && stories.length > 0) {
      const currentAuthor = stories[currentAuthorIndex];
      const currentStory = currentAuthor?.stories[currentStoryIndex];
      
      if (currentStory) {
        // Mark as viewed
        if (!viewedStories.has(currentStory._id)) {
          onStoryView(currentStory._id);
          setViewedStories(prev => new Set([...prev, currentStory._id]));
        }

        // Auto-advance after 5 seconds
        timeoutRef.current = setTimeout(() => {
          if (currentStoryIndex < currentAuthor.stories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
          } else if (currentAuthorIndex < stories.length - 1) {
            setCurrentAuthorIndex(prev => prev + 1);
            setCurrentStoryIndex(0);
          } else {
            setShowStoryViewer(false);
          }
        }, 5000);

        return () => clearTimeout(timeoutRef.current);
      }
    }
  }, [currentStoryIndex, currentAuthorIndex, showStoryViewer, stories, onStoryView, viewedStories]);

  const handleStoryClick = (authorIndex, storyIndex = 0) => {
    setCurrentAuthorIndex(authorIndex);
    setCurrentStoryIndex(storyIndex);
    setShowStoryViewer(true);
  };

  const handleClose = () => {
    setShowStoryViewer(false);
    setCurrentAuthorIndex(0);
    setCurrentStoryIndex(0);
    clearTimeout(timeoutRef.current);
  };

  const handleNext = () => {
    const currentAuthor = stories[currentAuthorIndex];
    if (currentStoryIndex < currentAuthor.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else if (currentAuthorIndex < stories.length - 1) {
      setCurrentAuthorIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentAuthorIndex > 0) {
      setCurrentAuthorIndex(prev => prev - 1);
      const prevAuthor = stories[currentAuthorIndex - 1];
      setCurrentStoryIndex(prevAuthor.stories.length - 1);
    }
  };

  const currentAuthor = stories[currentAuthorIndex];
  const currentStory = currentAuthor?.stories[currentStoryIndex];

  return (
    <div className="mb-6">
      {/* Stories Bar */}
      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {/* Create Story Button */}
        <div className="flex flex-col items-center space-y-2">
          <button
            onClick={onCreateStory}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
          >
            +
          </button>
          <span className="text-xs text-gray-600 dark:text-gray-400">Add Story</span>
        </div>

        {/* Story Circles */}
        {stories.map((authorStories, authorIndex) => {
          const isCurrentUser = user && authorStories.author._id === user._id;
          const hasViewedStories = authorStories.stories.some(story => viewedStories.has(story._id));
          
          return (
            <div key={authorStories.author._id} className="flex flex-col items-center space-y-2">
              <button
                onClick={() => handleStoryClick(authorIndex)}
                className={`w-16 h-16 rounded-full p-0.5 ${
                  isCurrentUser 
                    ? hasViewedStories
                      ? 'bg-gray-300 dark:bg-gray-600'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600'
                    : hasViewedStories
                      ? 'bg-gray-300 dark:bg-gray-600'
                      : 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500'
                }`}
              >
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                  <img
                    src={authorStories.author.profileImage || 'https://via.placeholder.com/60x60'}
                    alt={authorStories.author.username}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                </div>
              </button>
              <span 
                className={`text-xs truncate max-w-16 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 ${
                  isCurrentUser 
                    ? 'text-blue-600 dark:text-blue-400 font-medium' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
                onClick={() => onNavigateToProfile && onNavigateToProfile(authorStories.author)}
                title="View profile"
              >
                {isCurrentUser ? 'Your Story' : authorStories.author.username}
              </span>
            </div>
          );
        })}
      </div>

      {/* Story Viewer Modal */}
      {showStoryViewer && currentStory && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          {/* Progress Bar */}
          <div className="absolute top-4 left-4 right-4 z-10">
            <div className="flex space-x-1">
              {currentAuthor.stories.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full ${
                    index <= currentStoryIndex ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Story Content */}
          <div className="relative w-full h-full flex items-center justify-center">
            {currentStory.mediaType === 'video' ? (
              <video
                src={currentStory.media}
                className="max-w-full max-h-full object-contain"
                autoPlay
                muted
                loop
              />
            ) : (
              <img
                src={currentStory.media}
                alt="Story"
                className="max-w-full max-h-full object-contain"
              />
            )}

            {/* Story Info */}
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="flex items-center space-x-3 mb-2">
                <img
                  src={currentAuthor.author.profileImage || 'https://via.placeholder.com/40x40'}
                  alt={currentAuthor.author.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className={`font-semibold cursor-pointer hover:text-blue-300 ${
                    user && currentAuthor.author._id === user._id 
                      ? 'text-blue-300' 
                      : ''
                  }`}
                  onClick={() => onNavigateToProfile && onNavigateToProfile(currentAuthor.author)}
                  >
                    {user && currentAuthor.author._id === user._id 
                      ? 'Your Story' 
                      : currentAuthor.author.username}
                  </div>
                  <div className="text-sm opacity-80">
                    {new Date(currentStory.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              {currentStory.caption && (
                <p className="text-sm">{currentStory.caption}</p>
              )}
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-2xl hover:bg-white/20 rounded-full p-2"
            >
              ‹
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-2xl hover:bg-white/20 rounded-full p-2"
            >
              ›
            </button>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white text-2xl hover:bg-white/20 rounded-full p-2"
            >
              ✕
            </button>

            {/* Delete Button (for story author) */}
            {user && currentStory.author === user._id && (
              <button
                onClick={() => {
                  onDeleteStory(currentStory._id);
                  handleClose();
                }}
                className="absolute top-4 left-4 text-white text-lg hover:bg-white/20 rounded-full p-2"
                title="Delete Story"
              >
                🗑️
              </button>
            )}
            
            {/* Your Story Indicator */}
            {user && currentAuthor.author._id === user._id && (
              <div className="absolute top-4 left-16 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Your Story
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Stories; 