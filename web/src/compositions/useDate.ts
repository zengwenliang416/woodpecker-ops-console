import { useI18n } from 'vue-i18n';

let currentLocale = 'en';
const EMPTY_TIME = '—';
const MAX_DATE_MS = 8_640_000_000_000_000;

function isValidDuration(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER;
}

function isValidTimestamp(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= MAX_DATE_MS;
}

function isValidDate(date: Date | undefined): date is Date {
  return date !== undefined && isValidTimestamp(date.getTime());
}

function splitDuration(durationMs: number) {
  const totalSeconds = durationMs / 1000;
  const totalMinutes = totalSeconds / 60;
  const totalHours = totalMinutes / 60;

  const seconds = Math.floor(totalSeconds) % 60;
  const minutes = Math.floor(totalMinutes) % 60;
  const hours = Math.floor(totalHours);

  return {
    seconds,
    minutes,
    hours,
    totalHours,
    totalMinutes,
    totalSeconds,
  };
}

function toLocaleString(date?: Date, tz?: string) {
  if (!isValidDate(date)) {
    return EMPTY_TIME;
  }

  try {
    return date.toLocaleString(currentLocale, {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: tz,
    });
  } catch {
    return EMPTY_TIME;
  }
}

function timeAgo(date: number) {
  if (!isValidTimestamp(date)) {
    return EMPTY_TIME;
  }

  const seconds = Math.floor((Date.now() - date) / 1000);

  const formatter = new Intl.RelativeTimeFormat(currentLocale);

  let interval = seconds / 31536000;
  if (interval > 1) {
    return formatter.format(-Math.round(interval), 'year');
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return formatter.format(-Math.round(interval), 'month');
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return formatter.format(-Math.round(interval), 'day');
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return formatter.format(-Math.round(interval), 'hour');
  }
  interval = seconds / 60;
  if (interval > 0.5) {
    return formatter.format(-Math.round(interval), 'minute');
  }
  return useI18n().t('time.just_now');
}

function prettyDuration(durationMs?: number) {
  if (!isValidDuration(durationMs)) {
    return EMPTY_TIME;
  }

  const t = splitDuration(durationMs);

  if (t.totalHours > 1) {
    return new Intl.NumberFormat(currentLocale, { style: 'unit', unit: 'hour', unitDisplay: 'long' }).format(
      Math.round(t.totalHours),
    );
  }
  if (t.totalMinutes > 1) {
    return new Intl.NumberFormat(currentLocale, { style: 'unit', unit: 'minute', unitDisplay: 'long' }).format(
      Math.round(t.totalMinutes),
    );
  }
  return new Intl.NumberFormat(currentLocale, { style: 'unit', unit: 'second', unitDisplay: 'long' }).format(
    Math.round(t.totalSeconds),
  );
}

function durationAsNumber(durationMs?: number): string {
  if (!isValidDuration(durationMs)) {
    return EMPTY_TIME;
  }

  const { seconds, minutes, hours } = splitDuration(durationMs);

  const minSecFormat = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minSecFormat}`;
  }

  return minSecFormat;
}

export function useDate() {
  async function setDateLocale(locale: string) {
    currentLocale = locale;
  }

  return {
    toLocaleString,
    timeAgo,
    prettyDuration,
    setDateLocale,
    durationAsNumber,
  };
}
