export interface RouteConfig {
  path: string;
  title: string;
  component: string;
  auth: boolean;
  meta?: Record<string, unknown>;
}

export type ComponentType = 'wc' | 'amis';

export function parseComponentUrl(url: string): { type: ComponentType; name: string } {
  if (url.startsWith('wc://')) {
    return { type: 'wc', name: url.slice(5) };
  }
  if (url.startsWith('amis://')) {
    return { type: 'amis', name: url.slice(7) };
  }
  return { type: 'wc', name: url };
}
