import { apiRequest } from '../../../lib/api-client';

const usernameFromEmail = (email) =>
  email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, '_')
    .slice(0, 50);

export function login({ email, password, rememberMe }) {
  return apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      rememberMe,
    }),
  });
}

export function register({ fullName, email, password }) {
  return apiRequest('/register', {
    method: 'POST',
    body: JSON.stringify({
      username: usernameFromEmail(email || fullName),
      email,
      password,
    }),
  });
}

export function logout() {
  return apiRequest('/logout', {
    method: 'POST',
  });
}

export function getMe() {
  return apiRequest('/me');
}
