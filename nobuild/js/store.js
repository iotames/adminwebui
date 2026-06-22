function createStore(initFn) {
  let state;
  const listeners = new Set();
  state = initFn((partial) => {
    state = { ...state, ...(typeof partial === 'function' ? partial(state) : partial) };
    listeners.forEach(fn => { try { fn(state); } catch {} });
  });
  return {
    getState: () => state,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

const storedToken = localStorage.getItem('token');
const storedUser = getStoredUser();

export const authStore = createStore((setState) => ({
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

export const menuStore = createStore((setState) => ({
  menus: [],
  routes: [],
  loading: false,
  setMenus: (menus) => setState({ menus }),
  setRoutes: (routes) => setState({ routes }),
  setLoading: (loading) => setState({ loading }),
}));

export function parseComponentUrl(url) {
  if (url.startsWith('wc://')) return { type: 'wc', name: url.slice(5) };
  if (url.startsWith('amis://')) return { type: 'amis', name: url.slice(7) };
  return { type: 'wc', name: url };
}
