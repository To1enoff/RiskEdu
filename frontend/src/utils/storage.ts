const TOKEN_KEY = 'riskedu_access_token';
const USER_KEY = 'riskedu_user';

export const storage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },
  getUser(): string | null {
    return localStorage.getItem(USER_KEY);
  },
  setUser(userJson: string): void {
    localStorage.setItem(USER_KEY, userJson);
  },
  clearUser(): void {
    localStorage.removeItem(USER_KEY);
  },
};
