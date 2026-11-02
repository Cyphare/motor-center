export const jakartaDate = (date: Date): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

export const isValidIsoCalendarDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
};

export const startOfJakartaDay = (day: string): Date =>
  new Date(`${day}T00:00:00+07:00`);

export const nextJakartaDay = (day: string): Date =>
  new Date(startOfJakartaDay(day).getTime() + 86_400_000);

export const previousJakartaDay = (day: string): string =>
  jakartaDate(new Date(startOfJakartaDay(day).getTime() - 86_400_000));

export const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
