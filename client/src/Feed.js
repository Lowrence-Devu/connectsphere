import React from 'react';
import Post from './Post'; // Change to '../Post' if the real Post.js is in src/

const Feed = ({
  posts,
  user,
  comments,
  showComments,
  commentText,
  onLike,
  onAddComment,
  onDeleteComment,
  onToggleComments,
  onNavigateToProfile,
  onPostClick,
  onCommentInput,
  onSubmitComment
}) => {
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No posts yet</h3>
        <p className="text-gray-500 dark:text-gray-400">No one has shared anything yet.</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {posts.map(post => (
        <Post
          key={post._id}
          post={post}
          user={user}
          comments={comments[post._id] || []}
          showComments={showComments[post._id]}
          commentText={commentText[post._id] || ''}
          onLike={() => onLike(post._id)}
          onCommentInput={(postId, value) => onCommentInput(postId, value)}
          onSubmitComment={onSubmitComment}
          onDeleteComment={onDeleteComment}
          onToggleComments={() => onToggleComments(post._id)}
          onNavigateToProfile={onNavigateToProfile}
          onPostClick={onPostClick}
        />
      ))}
    </div>
  );
};

export default Feed; 