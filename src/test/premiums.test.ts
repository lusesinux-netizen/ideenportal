import { describe, expect, it } from 'vitest';
import {
  PREMIUM_CLASSES,
  isMoneyOnlyClass,
  premiumChoiceOptions,
} from '@/lib/premiums';

describe('Prämienklassen', () => {
  it('Klasse 4 sieht ausschließlich eine finanzielle Prämie vor', () => {
    expect(PREMIUM_CLASSES[4].urlaub).toBeNull();
    expect(premiumChoiceOptions(4)).toEqual(['geld']);
    expect(isMoneyOnlyClass(4)).toBe(true);
  });

  it('Klasse 1 bis 3 bleiben in der Wahl zwischen Urlaub und Geld', () => {
    for (const cls of [1, 2, 3] as const) {
      expect(PREMIUM_CLASSES[cls].urlaub).toBeTruthy();
      expect(premiumChoiceOptions(cls)).toEqual(['urlaub', 'geld']);
      expect(isMoneyOnlyClass(cls)).toBe(false);
    }
  });
});
