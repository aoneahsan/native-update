import { registerPlugin } from '@capacitor/core';

import type {
  CapacitorNativeUpdateCombinedPlugin,
  CapacitorNativeUpdateListeners,
} from './definitions';

const CapacitorNativeUpdate = registerPlugin<
  CapacitorNativeUpdateCombinedPlugin & CapacitorNativeUpdateListeners
>('CapacitorNativeUpdate', {
  web: () => import('./web').then((m) => new m.CapacitorNativeUpdateWeb()),
});

export * from './definitions';
export * from './background-update';
export { CapacitorNativeUpdate };