import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calendarAnchor } from './calendarDate.js';

test('calendar accepts real dates, including leap days', () => {
  for (const date of ['2024-02-29', '2026-10-19', '2026-12-31']) assert.equal(calendarAnchor(`?date=${date}`), date);
});
test('invalid calendar links fall back to the local day instead of requesting invalid dates', () => {
  const today = new Date(2026, 9, 19, 23, 30);
  for (const date of ['', 'bad', '2026-02-29', '2026-02-30', '2026-13-01', '2026-00-10', '2026-10-00', '0000-01-01', '9999-12-31', '2026-1-1']) {
    assert.equal(calendarAnchor(`?date=${date}`, today), '2026-10-19', date);
  }
});
