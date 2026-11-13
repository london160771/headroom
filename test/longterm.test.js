// Tests for lib/longterm.js (the long-term model) on FIXTURE blocks made up for the tests.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fastestYear, gasPerDay, longTerm, yearOverYear, yearsTo } from '../lib/longterm.js';

const DAY = 86_400_000;
const T0 = Date.UTC(2024, 0, 1);
// Fixture: one block per day for 800 days, 100 blocks produced per day (ordinal step),
// gas per block grows 2x per 365 days from 1,000 Ggas (1 Tgas).
const fixture = Array.from({ length: 800 }, (_, i) => ({ ts: T0 + i * DAY, ordinal: i * 100, used: 1000 * 2 ** (i / 365) }));

test('gasPerDay = average Tgas per block x blocks per day from ordinals', () => {
  const flat = [0, 1, 2].map((i) => ({ ts: T0 + i * DAY, ordinal: i * 100, used: 2000 }));
  assert.equal(gasPerDay(flat, T0 - 1, T0 + 2 * DAY), 2 * 100);
  assert.equal(gasPerDay(flat, T0 + 5 * DAY, T0 + 9 * DAY), null);
});

test('yearOverYear finds the fixture growth of 2x a year', () => {
  const r = yearOverYear(fixture, fixture.at(-1).ts);
  assert.ok(Math.abs(r - 2) < 0.01, `got ${r}`);
});

test('fastestYear returns the best ratio and when it ended', () => {
  const shrinking = fixture.map((b, i) => ({ ...b, used: i < 400 ? 1000 * 2 ** (i / 365) : 1000 }));
  const f = fastestYear(shrinking, shrinking.at(-1).ts);
  assert.ok(f.ratio > 1.5);
  assert.ok(Date.parse(f.to) < shrinking.at(-1).ts);
});

test('yearsTo: ln(multiple)/ln(pace), and never without growth', () => {
  assert.equal(yearsTo(8, 2), 3);
  assert.equal(yearsTo(76, 1), null);
  assert.equal(yearsTo(76, 0.28), null);
  assert.equal(yearsTo(1, 2), null);
});

test('longTerm has measured rows around the reference paces, with years per bar', () => {
  const lt = longTerm(fixture, fixture.at(-1).ts, [{ id: 'fees_move', label: 'x', multiple: 64 }], [2, 4]);
  assert.deepEqual(lt.rows.map((r) => r.id), ['last_year', 'pace_2', 'pace_4', 'fastest_year']);
  assert.equal(lt.rows[1].years.fees_move, 6);
  assert.equal(lt.rows[2].years.fees_move, 3);
  assert.equal(lt.rows[0].measured, true);
});
