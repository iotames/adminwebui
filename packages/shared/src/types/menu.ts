export interface MenuItem {
  id: string;
  path: string;
  title: string;
  icon?: string;
  children?: MenuItem[];
  visible?: boolean;
}
