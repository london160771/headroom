import { describe, expect, test } from 'vitest';
import { day, gasPrice, month, pace, pct, tgas, times, years } from './format.js';

describe('format', () => {
  test('pct keeps small shares readable', () => {
    expect(pct(0.0061)).toBe('0.61%');
    expect(pct(0.196)).toBe('19.6%');
    expect(pct(0.00004)).toBe('0.004%');
    expect(pct(0)).toBe('0%');
    expect(pct(null)).toBe('–');
  });
  test('times rounds big multiples', () => {
    expect(times(82.4)).toBe('82×');
    expect(times(4.26)).toBe('4.3×');
    expect(times(1234.5)).toBe('1,235×');
    expect(times(null)).toBe('–');
  });
  test('pace keeps two decimals below 10, and years says never for no growth', () => {
    expect(pace(0.2802)).toBe('0.28×');
    expect(pace(2)).toBe('2×');
    expect(pace(1.5)).toBe('1.5×');
    expect(pace(10.3036)).toBe('10.3×');
    expect(years(6.243)).toBe('6.2 years');
    expect(years(null)).toBe('never');
  });
  test('dates are UTC', () => {
    expect(month('2024-03')).toBe('Mar 2024');
    expect(day(Date.UTC(2023, 11, 5, 23))).toBe('5 Dec 2023');
  });
  test('gas units', () => {
    expect(tgas(9_100_000_000)).toBe('9.1M Tgas');
    expect(gasPrice('100000000')).toBe('0.0001 NEAR per Tgas');
  });
});
