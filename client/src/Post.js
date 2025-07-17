import React, { useState } from 'react';

const Post = ({
  post,
  user,
  comments = [],
  showComments,
  commentText,
  onLike,
  onAddComment,
  onDeleteComment,
  onToggleComments,
  onNavigateToProfile,
  onDeletePost
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  if (!post) return null;
  const isAuthor = user && post.author && (user._id === post.author._id || user.id === post.author._id);
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 max-w-full sm:max-w-[500px] mx-auto mb-6 transition-all duration-200">
      {/* Post Header */}
      <div className="flex items-center space-x-3 mb-3 relative">
        <div
          className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer"
          onClick={() => onNavigateToProfile(post.author)}
        >
          <span className="text-white font-semibold text-sm">
            {post.author?.username?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span
              className="font-semibold text-gray-800 dark:text-white cursor-pointer"
              onClick={() => onNavigateToProfile(post.author)}
            >
              {post.author?.username || 'Unknown'}
            </span>
            <span className="text-gray-400 dark:text-gray-500 text-sm">•</span>
            <span className="text-gray-400 dark:text-gray-500 text-sm">
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
        {/* Delete button for post author */}
        {isAuthor && (
          <button
            className="absolute top-0 right-0 p-2 text-red-500 hover:text-red-700 focus:outline-none"
            title="Delete Post"
            aria-label="Delete Post"
            onClick={() => setShowDeleteModal(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {/* Post Content */}
      {post.text && (
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">{post.text}</p>
      )}
      {post.image && (
        <div className="mb-3 flex justify-center">
          <img src={post.image} alt="Post" className="rounded-lg max-h-96 w-full object-cover aspect-square" />
        </div>
      )}
      {/* Post Actions */}
      <div className="flex items-center space-x-8 mb-3">
        <button
          onClick={onLike}
          className={`flex items-center space-x-1 text-blue-600 dark:text-blue-400 font-semibold focus:outline-none hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded transition`}
        >
          <span>👍</span>
          <span>{post.likes?.length || 0}</span>
        </button>
        <button
          onClick={onToggleComments}
          className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition"
        >
          <span>💬</span>
          <span>{comments.length}</span>
        </button>
      </div>
      {/* Comments Section */}
      {showComments && (
        <div className="mt-3">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {comments.length === 0 ? (
              <div className="text-gray-400 dark:text-gray-500 text-sm">No comments yet.</div>
            ) : (
              comments.map(comment => (
                <div key={comment._id} className="flex items-start space-x-2">
                  <div 
                    className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center cursor-pointer"
                    onClick={() => onNavigateToProfile(comment.author)}
                    title="View profile"
                  >
                    <span className="text-white font-semibold text-xs">
                      {comment.author?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span 
                        className="font-semibold text-gray-800 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => onNavigateToProfile(comment.author)}
                      >
                        {comment.author?.username || 'Unknown'}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">{comment.text}</p>
                  </div>
                  {user && comment.author?._id === user._id && (
                    <button onClick={() => onDeleteComment(comment._id)} className="text-red-500 hover:text-red-700 text-xs ml-2">Delete</button>
                  )}
                </div>
              ))
            )}
          </div>
          <form onSubmit={e => { e.preventDefault(); onAddComment(); }} className="flex items-center space-x-2 mt-3">
            <input
              type="text"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Add a comment..."
              value={commentText}
              onChange={e => onAddComment(post._id, e.target.value)}
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Post</button>
          </form>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-80 max-w-full flex flex-col items-center">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Delete Post?</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-center">Are you sure you want to delete this post? This action cannot be undone.</p>
            <div className="flex gap-4 w-full">
              <button
                className="flex-1 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-all duration-200"
                onClick={() => {
                  setShowDeleteModal(false);
                  if (onDeletePost) onDeletePost(post._id);
                }}
              >
                Delete
              </button>
              <button
                className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Post; 