export function buildSearchTrace(values, target, method = 'linear') {
  if (!Array.isArray(values) || values.some(n => !Number.isFinite(n)) || !Number.isFinite(target)) throw new Error('Use finite numbers for the array and target.');
  if (!['linear', 'binary'].includes(method)) throw new Error('Choose linear or binary search.');
  if (method === 'binary' && values.some((n, i) => i > 0 && n < values[i - 1])) throw new Error('Binary search needs an array sorted from smallest to largest.');
  const frames = [{ index: -1, checked: [], low: 0, high: values.length - 1, message: `Find ${target}. Indices start at 0.`, done: false }];
  const checked = [];
  let low = 0, high = values.length - 1;
  while (low <= high) {
    const index = method === 'linear' ? low : low + Math.floor((high - low) / 2);
    const found = values[index] === target;
    frames.push({ index, checked: [...checked], low, high, found, done: found,
      message: found ? `Found ${target} at index ${index}, after ${checked.length + 1} comparison${checked.length ? 's' : ''}.` : `Index ${index}: ${values[index]} ${values[index] < target ? '<' : '>'} ${target}. ${method === 'linear' ? 'Move to the next element.' : values[index] < target ? 'Keep the right half.' : 'Keep the left half.'}` });
    checked.push(index);
    if (found) return frames;
    if (method === 'linear' || values[index] < target) low = index + 1;
    else high = index - 1;
  }
  frames.push({ index: -1, checked: [...checked], low, high, done: true, found: false, message: `${target} is not in the array. Return -1. ${checked.length} comparisons.` });
  return frames;
}
