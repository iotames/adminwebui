import { createStore } from 'zustand/vanilla';

interface UserInfo {
  id: number;
  username: string;
  nickname: string;
}

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserInfo) => void;
  logout: () => void;
}

function getStoredUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const storedToken = localStorage.getItem('token');
const storedUser = getStoredUser();

export const authStore = createStore<AuthState>((setState) => ({
  token: storedToken,
  user: storedUser,
  isAuthenticated: !!storedToken,
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setState({ token, user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setState({ token: null, user: null, isAuthenticated: false });
  },
}));
