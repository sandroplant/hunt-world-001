// Street kit builders (round 5): the harbor street's code-made objects. Each builder lives in a street_*.ts file.
import type { KitBuilder } from './types';
import { gull, gull_flying } from './street_birds';
import { hanging_sign, letterbox, lighthouse_lantern, weathervane } from './street_fixtures';
import { doorbell, glass_float, notice, ship_bottle, starfish, toy_sailboat, umbrella } from './street_small';
import { canopy, chalkboard, fish_net, fish_scale, rope_coil } from './street_stall';

export const streetKit: Record<string, KitBuilder> = {
  umbrella,
  ship_bottle,
  chalkboard,
  fish_scale,
  gull,
  gull_flying,
  hanging_sign,
  notice,
  doorbell,
  starfish,
  toy_sailboat,
  glass_float,
  rope_coil,
  fish_net,
  canopy,
  letterbox,
  weathervane,
  lighthouse_lantern,
};
