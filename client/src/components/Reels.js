import React, { useState, useEffect, useRef } from 'react';

const Reels = ({ 
  reels, 
  onLike, 
  onComment, 
  onShare, 
  onDelete,
  user,
  currentReelIndex = 0,
  onReelChange
}) => {
  const [currentIndex, setCurrentIndex] = useState(currentReelIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const videoRefs = useRef({});

  useEffect(() => {
    setCurrentIndex(currentReelIndex);
  }, [currentReelIndex]);

  const currentReel = reels[currentIndex];

  const handleVideoClick = () => {
    const video = videoRefs.current[currentReel?._id];
    if (video) {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        video.play();
        setIsPlaying(true);
      }
    }
  };

  const handleLike = () => {
    if (onLike && currentReel) {
      onLike(currentReel._id);
    }
  };

  const handleComment = () => {
    setShowComments(!showComments);
  };

  const handleShare = () => {
    if (onShare && currentReel) {
      onShare(currentReel._id);
    }
  };

  const handleSubmitComment = () => {
    if (commentText.trim() && onComment && currentReel) {
      onComment(currentReel._id, commentText);
      setCommentText('');
    }
  };

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setIsPlaying(true);
      setShowComments(false);
      if (onReelChange) onReelChange(newIndex);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setIsPlaying(true);
      setShowComments(false);
      if (onReelChange) onReelChange(newIndex);
    }
  };

  const isLiked = currentReel?.likes?.some(like => 
    like.user._id === user?._id
  );

  if (!currentReel) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">📹</div>
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No reels yet</h3>
          <p className="text-gray-500 dark:text-gray-400">No reels available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-black">
      {/* Video Container */}
      <div className="relative h-full">
        <video
          ref={el => videoRefs.current[currentReel._id] = el}
          src={currentReel.video}
          poster={currentReel.thumbnail}
          className="w-full h-full object-cover"
          loop
          muted
          playsInline
          onClick={handleVideoClick}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black bg-opacity-50 rounded-full p-4">
              <span className="text-white text-4xl">▶️</span>
            </div>
          </div>
        )}
      </div>

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-6">
        {/* Author Info */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white">
            <img
              src={currentReel.author.profileImage || 'https://via.placeholder.com/48x48'}
              alt={currentReel.author.username}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center">
            <div className="text-white font-semibold text-sm">
              {currentReel.author.username}
            </div>
          </div>
        </div>

        {/* Like Button */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center space-y-1"
        >
          <div className="text-3xl">
            {isLiked ? '❤️' : '🤍'}
          </div>
          <span className="text-white text-xs">
            {currentReel.likes?.length || 0}
          </span>
        </button>

        {/* Comment Button */}
        <button
          onClick={handleComment}
          className="flex flex-col items-center space-y-1"
        >
          <div className="text-3xl">💬</div>
          <span className="text-white text-xs">
            {currentReel.comments?.length || 0}
          </span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center space-y-1"
        >
          <div className="text-3xl">📤</div>
          <span className="text-white text-xs">
            {currentReel.shares || 0}
          </span>
        </button>

        {/* Delete Button (for reel author) */}
        {user && currentReel.author._id === user._id && onDelete && (
          <button
            onClick={() => onDelete(currentReel._id)}
            className="flex flex-col items-center space-y-1"
          >
            <div className="text-3xl">🗑️</div>
            <span className="text-white text-xs">Delete</span>
          </button>
        )}
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-4 left-4 right-20 text-white">
        <div className="mb-2">
          <span className="font-semibold">{currentReel.author.username}</span>
          {currentReel.caption && (
            <span className="ml-2">{currentReel.caption}</span>
          )}
        </div>
        
        {/* Music Info */}
        {currentReel.music?.title && (
          <div className="flex items-center space-x-2 text-sm opacity-80">
            <span>🎵</span>
            <span>{currentReel.music.title}</span>
            {currentReel.music.artist && (
              <span>• {currentReel.music.artist}</span>
            )}
          </div>
        )}

        {/* Tags */}
        {currentReel.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {currentReel.tags.map((tag, index) => (
              <span key={index} className="text-blue-400 text-sm">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={handlePrevious}
        disabled={currentIndex === 0}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-3xl hover:bg-white/20 rounded-full p-2 disabled:opacity-50"
      >
        ‹
      </button>
      <button
        onClick={handleNext}
        disabled={currentIndex === reels.length - 1}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-3xl hover:bg-white/20 rounded-full p-2 disabled:opacity-50"
      >
        ›
      </button>

      {/* Comments Panel */}
      {showComments && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-90 text-white p-4 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Comments ({currentReel.comments?.length || 0})</h3>
            <button
              onClick={() => setShowComments(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          {/* Comment Input */}
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 bg-gray-800 rounded-lg text-white placeholder-gray-400"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              Post
            </button>
          </div>

          {/* Comments List */}
          <div className="space-y-3">
            {currentReel.comments?.map((comment, index) => (
              <div key={index} className="flex items-start space-x-2">
                <img
                  src={comment.user.profileImage || 'https://via.placeholder.com/32x32'}
                  alt={comment.user.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm">{comment.user.username}</span>
                    <span className="text-gray-400 text-xs">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
        <div 
          className="h-full bg-white transition-all duration-300"
          style={{ 
            width: `${((currentIndex + 1) / reels.length) * 100}%` 
          }}
        />
      </div>
    </div>
  );
};

export default Reels; 