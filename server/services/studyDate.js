export function studyDate(timeZone = 'UTC', now = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type).value).join('-');
  } catch { return studyDate('UTC', now); }
}
export const requestDate = req => studyDate(req.get('X-Timezone') || 'UTC');
export function addStudyDays(dateKey, days) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function nextReview(dateKey, stage, recalled) {
  const nextStage = recalled ? Math.min(stage + 1, 4) : 0;
  return { reviewStage: nextStage, dueDate: addStudyDays(dateKey, [1, 3, 7, 14, 30][nextStage]) };
}
