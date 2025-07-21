import React from 'react';

const PostModal = ({
  post,
  user,
  comments = [],
  onClose,
  onLike,
  onAddComment,
  onDeleteComment,
  commentText = '',
  onCommentInput,
  onSubmitComment
}) => {
  if (!post) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 relative transform transition-all duration-300 scale-95 opacity-0 animate-modal-in">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 dark:text-gray-300 hover:text-red-500 text-2xl font-bold"
        >
          &times;
        </button>
        <div className="flex flex-col md:flex-row">
          {post.image && (
            <div className="md:w-1/2 flex items-center justify-center p-4">
              <img src={post.image} alt="Post" className="rounded-lg max-h-96 w-full object-contain" />
            </div>
          )}
          <div className="flex-1 p-4 flex flex-col">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {post.author?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-semibold text-gray-800 dark:text-white">{post.author?.username || 'Unknown'}</span>
              <span className="text-gray-400 dark:text-gray-500 text-xs ml-auto">
                {new Date(post.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="mb-2 text-gray-700 dark:text-gray-300">{post.text}</div>
            <div className="flex items-center space-x-4 mb-4">
              <button onClick={onLike} className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 font-semibold transition-transform duration-150 hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                <svg className="w-6 h-6 transition-colors duration-200 hover:text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21C12 21 4 13.5 4 8.5C4 5.42 6.42 3 9.5 3C11.24 3 12.91 4.1 13.44 5.68C13.97 4.1 15.64 3 17.38 3C20.46 3 22.88 5.42 22.88 8.5C22.88 13.5 15 21 15 21H12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{post.likes?.length || 0}</span>
              </button>
              <span className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                <span>💬</span>
                <span>{comments.length}</span>
              </span>
            </div>
            <div className="flex-1 overflow-y-auto mb-2 max-h-48">
              {comments.length === 0 ? (
                <div className="text-gray-400 dark:text-gray-500 text-center">No comments yet.</div>
              ) : (
                comments.map(comment => (
                  <div key={comment._id} className="flex items-start space-x-2 mb-2">
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
                      <button onClick={() => onDeleteComment(comment._id)} className="text-red-500 hover:text-red-700 text-xs ml-2 transition-transform duration-150 hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400">Delete</button>
                    )}
                  </div>
                ))
              )}
            </div>
            <form onSubmit={e => { e.preventDefault(); onSubmitComment(post._id); }} className="flex items-center space-x-2 mt-2">
              <textarea
                className="w-full flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-y min-h-[40px] max-h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Add a comment..."
                value={commentText}
                onChange={e => onCommentInput(post._id, e.target.value)}
                rows={1}
                maxLength={300}
              />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Post</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostModal; 