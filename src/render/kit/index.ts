// One registry for the kit. Names are the `look.kit` values in props.json and objects.json.
import type { KitBuilder } from './types';
import { streetKit } from './street';
import { shopKit } from './shop';

export const kit: Record<string, KitBuilder> = { ...streetKit, ...shopKit };
export type { KitBuilder, KitItem, KitOptions } from './types';
