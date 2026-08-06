import { apiRequest } from '../../../lib/api-client';

const usernameFromEmail = (email) =>
  email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, '_')
    .slice(0, 50);

export function login({ identifier, email, password, rememberMe }) {
  return apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: identifier || email,
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

export function forgotPassword({ email }) {
  return apiRequest('/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPassword({ email, otp, password }) {
  return apiRequest('/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, otp, password }),
  });
}
