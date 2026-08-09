import { describe, expect, it } from 'vitest';

import { useDate } from './useDate';

describe('useDate', () => {
  const fallback = '—';

  it('renders a neutral fallback for invalid or missing dates', () => {
    const { timeAgo, toLocaleString } = useDate();

    expect(toLocaleString()).toBe(fallback);
    expect(toLocaleString(new Date(Number.NaN))).toBe(fallback);
    expect(toLocaleString(new Date(0))).toBe(fallback);
    expect(timeAgo(Number.NaN)).toBe(fallback);
    expect(timeAgo(Number.POSITIVE_INFINITY)).toBe(fallback);
    expect(timeAgo(-1)).toBe(fallback);
    expect(timeAgo(0)).toBe(fallback);
  });

  it('renders a neutral fallback for invalid durations', () => {
    const { durationAsNumber, prettyDuration } = useDate();
    const invalidDurations = [
      undefined,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      -1,
      Number.MAX_SAFE_INTEGER + 1,
    ];

    for (const duration of invalidDurations) {
      expect(prettyDuration(duration)).toBe(fallback);
      expect(durationAsNumber(duration)).toBe(fallback);
    }
  });

  it('preserves locale-aware valid dates and durations', async () => {
    const { durationAsNumber, prettyDuration, setDateLocale, toLocaleString } = useDate();
    const date = new Date('2026-08-09T08:00:00.000Z');

    await setDateLocale('en');

    expect(toLocaleString(date, 'UTC')).toBe(
      date.toLocaleString('en', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'UTC',
      }),
    );
    expect(prettyDuration(90_000)).not.toBe(fallback);
    expect(durationAsNumber(90_000)).toBe('01:30');
  });

  it('keeps cumulative hours instead of wrapping after 24 hours', () => {
    const { durationAsNumber } = useDate();

    expect(durationAsNumber(25 * 60 * 60 * 1000 + 61_000)).toBe('25:01:01');
  });
});
