import { registerPlugin } from '@capacitor/core';

import type {
  NativeUpdateCombinedPlugin,
  NativeUpdateListeners,
} from './definitions';

const CapacitorNativeUpdate = registerPlugin<
  NativeUpdateCombinedPlugin & NativeUpdateListeners
>('CapacitorNativeUpdate', {
  web: () => import('./web').then((m) => new m.NativeUpdateWeb()),
});

export * from './definitions';
export * from './background-update';
export { CapacitorNativeUpdate };