import { setupWorker } from 'msw/browser';
import { systemHandlers } from './handlers/system';
import { authHandlers } from './handlers/auth';
import { deptHandlers } from './handlers/dept';
import { userHandlers } from './handlers/user';

export const worker = setupWorker(
  ...systemHandlers,
  ...authHandlers,
  ...deptHandlers,
  ...userHandlers,
);
