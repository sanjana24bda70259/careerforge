export function calendarAnchor(search, today = new Date()) {
  const fallback = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const value = new URLSearchParams(search).get('date');
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  const date = new Date(`${value}T12:00:00`);
  if (!Number.isFinite(date.getTime()) || date.getFullYear() < 1000 || date.getFullYear() > 9998) return fallback;
  return date.getFullYear() === Number(value.slice(0, 4)) && date.getMonth() + 1 === Number(value.slice(5, 7)) && date.getDate() === Number(value.slice(8, 10)) ? value : fallback;
}
