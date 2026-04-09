export function parseDateOrNull(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseStartOfDayOrNull(value: string | null | undefined): Date | null {
  const parsed = parseDateOrNull(value);
  if (parsed === null) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

export function parseEndOfDayOrNull(value: string | null | undefined): Date | null {
  const parsed = parseDateOrNull(value);
  if (parsed === null) {
    return null;
  }

  parsed.setHours(23, 59, 59, 999);
  return parsed;
}
