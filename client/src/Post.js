import React from 'react';

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
  onNavigateToProfile
}) => {
  if (!post) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 mb-4">
      {/* Post Header */}
      <div className="flex items-center space-x-3 mb-4">
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
      </div>
      {/* Post Content */}
      {post.text && (
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">{post.text}</p>
      )}
      {post.image && (
        <div className="mb-3">
          <img src={post.image} alt="Post" className="rounded-lg max-h-96 w-full object-cover" />
        </div>
      )}
      {/* Post Actions */}
      <div className="flex items-center space-x-6 mb-2">
        <button
          onClick={onLike}
          className={`flex items-center space-x-1 text-blue-600 dark:text-blue-400 font-semibold focus:outline-none`}
        >
          <span>👍</span>
          <span>{post.likes?.length || 0}</span>
        </button>
        <button
          onClick={onToggleComments}
          className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 focus:outline-none"
        >
          <span>💬</span>
          <span>{comments.length}</span>
        </button>
      </div>
      {/* Comments Section */}
      {showComments && (
        <div className="mt-2">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {comments.length === 0 ? (
              <div className="text-gray-400 dark:text-gray-500 text-sm">No comments yet.</div>
            ) : (
              comments.map(comment => (
                <div key={comment._id} className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">
                      {comment.author?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-800 dark:text-white">{comment.author?.username || 'Unknown'}</span>
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
          <form onSubmit={e => { e.preventDefault(); onAddComment(); }} className="flex items-center space-x-2 mt-2">
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
    </div>
  );
};

export default Post; 