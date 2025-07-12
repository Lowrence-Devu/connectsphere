const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function withApiPrefix(path) {
  // If API_URL already ends with /api, don't add another /api
  if (API_URL.endsWith('/api')) {
    return `${API_URL}${path}`;
  } else {
    return `${API_URL}/api${path}`;
  }
}

export async function login(email, password) {
  const res = await fetch(withApiPrefix('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

export async function register(username, email, password) {
  const res = await fetch(withApiPrefix('/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  return res.json();
}

export async function getPosts() {
  const res = await fetch(withApiPrefix('/posts'));
  return res.json();
}

export async function createPost({ text, image, token }) {
  const res = await fetch(withApiPrefix('/posts'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ text, image })
  });
  return res.json();
}

export async function likePost(postId, token) {
  const res = await fetch(withApiPrefix(`/posts/${postId}/like`), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function getMessages(token) {
  const res = await fetch(withApiPrefix('/messages/inbox'), {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

// Stories API
export async function createStory(storyData, token) {
  const res = await fetch(withApiPrefix('/stories'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: storyData
  });
  return res.json();
}

export async function getStories(token) {
  const res = await fetch(withApiPrefix('/stories'), {
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  return res.json();
}

export async function viewStory(storyId, token) {
  const res = await fetch(withApiPrefix(`/stories/${storyId}/view`), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  return res.json();
}

export async function deleteStory(storyId, token) {
  const res = await fetch(withApiPrefix(`/stories/${storyId}`), {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  return res.json();
}

// Reels API
export async function createReel(reelData, token) {
  const res = await fetch(withApiPrefix('/reels'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: reelData
  });
  return res.json();
}

export async function getReels(token, page = 1, limit = 10) {
  const res = await fetch(withApiPrefix(`/reels?page=${page}&limit=${limit}`), {
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  return res.json();
}

export async function getTrendingReels(token, limit = 10) {
  const res = await fetch(withApiPrefix(`/reels/trending?limit=${limit}`), {
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  return res.json();
}

export async function getUserReels(userId, token, page = 1, limit = 10) {
  const res = await fetch(withApiPrefix(`/reels/user/${userId}?page=${page}&limit=${limit}`), {
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  return res.json();
}

export async function getReel(reelId, token) {
  const res = await fetch(withApiPrefix(`/reels/${reelId}`), {
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  return res.json();
}

export async function likeReel(reelId, token) {
  const res = await fetch(withApiPrefix(`/reels/${reelId}/like`), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  return res.json();
}

export async function commentReel(reelId, text, token) {
  const res = await fetch(withApiPrefix(`/reels/${reelId}/comments`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ text })
  });
  return res.json();
}

export async function shareReel(reelId, token) {
  const res = await fetch(withApiPrefix(`/reels/${reelId}/share`), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  return res.json();
}

export async function deleteReel(reelId, token) {
  const res = await fetch(withApiPrefix(`/reels/${reelId}`), {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  return res.json();
}

// Video Call API
export async function createVideoCall(targetUserId, token) {
  const res = await fetch(withApiPrefix('/video-calls'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ targetUserId })
  });
  return res.json();
}

export async function acceptVideoCall(callId, token) {
  const res = await fetch(withApiPrefix(`/video-calls/${callId}/accept`), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  return res.json();
}

export async function rejectVideoCall(callId, token) {
  const res = await fetch(withApiPrefix(`/video-calls/${callId}/reject`), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  return res.json();
}

export async function endVideoCall(callId, token) {
  const res = await fetch(withApiPrefix(`/video-calls/${callId}/end`), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  return res.json();
}

export async function getVideoCallStatus(callId, token) {
  const res = await fetch(withApiPrefix(`/video-calls/${callId}/status`), {
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  return res.json();
}

export async function getActiveVideoCalls(token) {
  const res = await fetch(withApiPrefix('/video-calls/active'), {
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  return res.json();
}

// Push Notification API
export async function updateFCMToken(fcmToken, token) {
  const res = await fetch(withApiPrefix('/push-notifications/fcm-token'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ fcmToken })
  });
  return res.json();
}

export async function updateNotificationSettings(settings, token) {
  const res = await fetch(withApiPrefix('/push-notifications/settings'), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ notificationSettings: settings })
  });
  return res.json();
}

export async function getNotificationSettings(token) {
  const res = await fetch(withApiPrefix('/push-notifications/settings'), {
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  return res.json();
}

export async function sendTestNotification(token) {
  const res = await fetch(withApiPrefix('/push-notifications/test'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  return res.json();
}

export async function subscribeToTopic(topic, token) {
  const res = await fetch(withApiPrefix('/push-notifications/subscribe'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ topic })
  });
  return res.json();
}

export async function unsubscribeFromTopic(topic, token) {
  const res = await fetch(withApiPrefix('/push-notifications/unsubscribe'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ topic })
  });
  return res.json();
} 