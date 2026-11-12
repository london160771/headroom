import { describe, expect, test } from 'vitest';
import { day, gasPrice, month, pct, tgas, times } from './format.js';

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
  test('dates are UTC', () => {
    expect(month('2024-03')).toBe('Mar 2024');
    expect(day(Date.UTC(2023, 11, 5, 23))).toBe('5 Dec 2023');
  });
  test('gas units', () => {
    expect(tgas(9_100_000_000)).toBe('9.1M Tgas');
    expect(gasPrice('100000000')).toBe('0.0001 NEAR per Tgas');
  });
});
