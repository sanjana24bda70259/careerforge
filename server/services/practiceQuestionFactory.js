export const clean = value => typeof value === 'number' ? String(Number(value.toFixed(4))) : String(value);
export function mcq(id, prompt, answer, wrong, explanation, extra = {}) {
  const options = [...new Set([answer, ...wrong].map(clean))];
  if (options.length !== 4) throw new Error(`${id}: expected four distinct answers`);
  const shift = [...id].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 4;
  const ordered = [...options.slice(shift), ...options.slice(0, shift)];
  return { id, prompt, options: ordered, correctAnswer: ordered.indexOf(clean(answer)), explanation, ...extra };
}
export function numeric(id, prompt, answer, explanation, unit = '', extra = {}) {
  const step = Math.max(1, Math.abs(answer) / 5);
  return mcq(id, prompt, `${clean(answer)}${unit}`, [answer - step, answer + step, answer + 2 * step].map(n => `${clean(n)}${unit}`), explanation, extra);
}
export const gcd = (a, b) => b ? gcd(b, a % b) : a;
export const choose = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - i + 1) / i; return Math.round(r); };
