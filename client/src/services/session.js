export const TOKEN_KEY = 'careerforge_token';
export const USER_KEY = 'careerforge_user';
export const SESSION_ENDED = 'careerforge:session-ended';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function endSession(expectedToken = getToken()) {
  // A delayed response from an old session must not log out a new login.
  if (getToken() !== expectedToken) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(SESSION_ENDED));
}
