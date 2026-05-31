import { createStore } from 'zustand/vanilla';
import type { MenuItem, RouteConfig } from '../types';

interface MenuState {
  menus: MenuItem[];
  routes: RouteConfig[];
  loading: boolean;
  setMenus: (menus: MenuItem[]) => void;
  setRoutes: (routes: RouteConfig[]) => void;
  setLoading: (loading: boolean) => void;
}

export const menuStore = createStore<MenuState>((setState) => ({
  menus: [],
  routes: [],
  loading: false,
  setMenus: (menus) => setState({ menus }),
  setRoutes: (routes) => setState({ routes }),
  setLoading: (loading) => setState({ loading }),
}));
