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