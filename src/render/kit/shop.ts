// Shop kit builders: the curiosity shop's code-made objects (round 5). Each is built in metres, centred on its box,
// front +Z, and fitted to the asked size. The builders live in shop_small, shop_big and shop_cat.
import type { KitBuilder } from './types';
import { brass_scales, compass, counter_bell, globe, key, marble, music_box, snow_globe, spectacles, teacup_star, toy_mouse } from './shop_small';
import { big_book, book, cash_box, jar, mouse_hole, sea_chart, shop_counter } from './shop_big';
import { cat_sleeping } from './shop_cat';

export const shopKit: Record<string, KitBuilder> = {
  key,
  counter_bell,
  brass_scales,
  globe,
  music_box,
  big_book,
  cash_box,
  spectacles,
  snow_globe,
  compass,
  toy_mouse,
  teacup_star,
  marble,
  cat_sleeping,
  book,
  jar,
  sea_chart,
  mouse_hole,
  shop_counter,
};
