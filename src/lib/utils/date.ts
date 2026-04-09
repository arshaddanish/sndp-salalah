export function parseDateOrNull(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? new Date(`${trimmed}T00:00:00.000Z`)
    : new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseStartOfDayOrNull(value: string | null | undefined): Date | null {
  const parsed = parseDateOrNull(value);
  if (parsed === null) {
    return null;
  }

  parsed.setUTCHours(0, 0, 0, 0);
  return parsed;
}

export function parseEndOfDayOrNull(value: string | null | undefined): Date | null {
  const parsed = parseDateOrNull(value);
  if (parsed === null) {
    return null;
  }

  parsed.setUTCHours(23, 59, 59, 999);
  return parsed;
}
