/*
 * Original, deterministic placement-practice material.  Questions are built
 * from validated numeric relationships so a client never supplies a score or
 * an answer key.  `setId` keeps DI and puzzle questions together.
 */
const levels = index => index % 5 === 4 ? 3 : index % 2 ? 2 : 1;
const clean = value => Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
const shuffled = (correct, wrong, seed) => {
  const options = [...new Set([correct, ...wrong].map(String))];
  let filler = 2;
  while (options.length < 4) { const candidate = `${correct} (${filler})`; if (!options.includes(candidate)) options.push(candidate); filler += 1; }
  const shift = seed % 4;
  const ordered = [...options.slice(shift), ...options.slice(0, shift)].slice(0, 4);
  return { options: ordered, correctAnswer: ordered.indexOf(String(correct)) };
};
const numberOptions = (answer, seed, suffix = '', step = Math.max(1, Math.abs(answer) > 60 ? 10 : 2)) => shuffled(`${clean(answer)}${suffix}`, [`${clean(answer + step)}${suffix}`, `${clean(answer - step)}${suffix}`, `${clean(answer + step * 2)}${suffix}`], seed);
const advancedQuestion = ({ id, category, topic, index, text, answer, wrong, explanation, shortcut, formulaIds = [], tags = [], estimatedTimeSeconds = 120, setId = null, setContext = null, section = null }) => ({
  id,
  track: 'advanced',
  category,
  topic,
  level: levels(index),
  question: text,
  ...(wrong ? shuffled(answer, wrong, index) : numberOptions(answer, index)),
  explanation,
  shortcut: shortcut || null,
  formulaIds,
  tags,
  estimatedTimeSeconds,
  setId,
  setContext,
  section
});
const q = (topic, index, data) => advancedQuestion({ id: `advanced-${topic}-${String(index + 1).padStart(3, '0')}`, topic, index, category: 'quantitative', ...data });

export const advancedTopics = [
  ['percentages', 'Percentages', 'QUANTITATIVE', 'percentage-change'], ['profit-loss-discount', 'Profit, Loss & Discount', 'QUANTITATIVE', 'profit-percent'], ['ratio-proportion', 'Ratio & Proportion', 'QUANTITATIVE', 'ratio-share'], ['average', 'Average', 'QUANTITATIVE', 'average'], ['mixture-alligation', 'Mixture & Alligation', 'QUANTITATIVE', 'mixture'], ['time-work', 'Time & Work', 'QUANTITATIVE', 'time-work'], ['pipes-cisterns', 'Pipes & Cisterns', 'QUANTITATIVE', 'pipes'], ['time-speed-distance', 'Time, Speed & Distance', 'QUANTITATIVE', 'speed-distance-time'], ['boats-streams', 'Boats & Streams', 'QUANTITATIVE', 'boats-streams'], ['trains', 'Trains', 'QUANTITATIVE', 'trains'], ['interest', 'Simple & Compound Interest', 'QUANTITATIVE', 'compound-interest'], ['number-system', 'Number System', 'QUANTITATIVE', 'number-system'], ['lcm-hcf', 'LCM & HCF', 'QUANTITATIVE', 'lcm-hcf'], ['permutation-combination', 'Permutation & Combination', 'QUANTITATIVE', 'permutation-combination'], ['probability', 'Probability', 'QUANTITATIVE', 'probability'], ['mensuration', 'Mensuration', 'QUANTITATIVE', 'mensuration'],
  ['data-interpretation', 'Data Interpretation', 'DATA INTERPRETATION', 'data-interpretation'],
  ['seating-arrangement', 'Seating Arrangement', 'LOGICAL REASONING', null], ['blood-relations', 'Blood Relations', 'LOGICAL REASONING', null], ['direction-sense', 'Direction Sense', 'LOGICAL REASONING', null], ['coding-decoding', 'Coding-Decoding', 'LOGICAL REASONING', null], ['syllogism', 'Syllogism', 'LOGICAL REASONING', null], ['statement-conclusion', 'Statement & Conclusion', 'LOGICAL REASONING', null], ['statement-assumption', 'Statement & Assumption', 'LOGICAL REASONING', null], ['data-sufficiency', 'Data Sufficiency', 'LOGICAL REASONING', null], ['ranking-ordering', 'Ranking & Ordering', 'LOGICAL REASONING', null], ['series', 'Series', 'LOGICAL REASONING', null], ['analogy', 'Analogy', 'LOGICAL REASONING', null], ['logical-deduction', 'Logical Deduction', 'LOGICAL REASONING', null],
  ['advanced-puzzles', 'Advanced Puzzles', 'PUZZLES', null],
  ['reading-comprehension', 'Reading Comprehension', 'VERBAL ABILITY', null], ['para-jumbles', 'Para Jumbles', 'VERBAL ABILITY', null], ['sentence-correction', 'Sentence Correction', 'VERBAL ABILITY', null], ['error-detection', 'Error Detection', 'VERBAL ABILITY', null], ['sentence-completion', 'Sentence Completion', 'VERBAL ABILITY', null], ['vocabulary-context', 'Vocabulary in Context', 'VERBAL ABILITY', null], ['synonyms-antonyms', 'Synonyms & Antonyms', 'VERBAL ABILITY', null], ['fill-in-the-blanks', 'Fill in the Blanks', 'VERBAL ABILITY', null], ['critical-reasoning', 'Critical Reasoning', 'VERBAL ABILITY', null]
].map(([id, name, group, formulaId]) => ({ id, name, group, formulaId }));
export const advancedCategories = advancedTopics.reduce((all, topic) => {
  const category = all.find(item => item.category === topic.group) || all[all.push({ category: topic.group, topics: [] }) - 1];
  category.topics.push(topic);
  return all;
}, []);

const quantBuilders = {
  percentages: i => { const original = 800 + (i % 5) * 100; const rise = 20 + (i % 3) * 5; const cut = 10 + (i % 4) * 5; const final = original * (100 + rise) / 100 * (100 - cut) / 100; return q('percentages', i, { text: `A subscription price is increased by ${rise}% and then discounted by ${cut}%. If the original price is ₹${original}, what is the final price?`, answer: `₹${clean(final)}`, wrong: [`₹${clean(original * (100 + rise - cut) / 100)}`, `₹${clean(original * (100 - cut) / 100)}`, `₹${clean(original * (100 + rise) / 100)}`], explanation: `Apply successive changes, not their difference: ${original} × ${100 + rise}/100 × ${100 - cut}/100 = ₹${clean(final)}.`, shortcut: `Multiply the two factors: ${(100 + rise) / 100} × ${(100 - cut) / 100}.`, formulaIds: ['percentage-change'], tags: ['Percentage', 'Successive change', 'Multi-concept'] }); },
  'profit-loss-discount': i => { const cp = 500 + (i % 5) * 100; const mark = 40 + (i % 3) * 10; const disc = 10 + (i % 4) * 5; const sp = cp * (100 + mark) / 100 * (100 - disc) / 100; const profit = (sp - cp) / cp * 100; return q('profit-loss-discount', i, { text: `An item costing ₹${cp} is marked ${mark}% above cost and sold after a ${disc}% discount. What is the profit percentage?`, answer: `${clean(profit)}%`, wrong: [`${clean(mark - disc)}%`, `${clean(mark)}%`, `${clean(disc)}%`], explanation: `SP = ${cp} × ${100 + mark}/100 × ${100 - disc}/100 = ₹${clean(sp)}. Profit% = (${clean(sp)} − ${cp})/${cp} × 100 = ${clean(profit)}%.`, shortcut: `Net SP factor is ${(1 + mark / 100) * (1 - disc / 100)} of cost.`, formulaIds: ['profit-percent'], tags: ['Profit & Loss', 'Discount', 'Percentage'] }); },
  'ratio-proportion': i => { const a = 3 + i % 3; const b = 5 + i % 4; const c = 7 + i % 3; const total = (a + b + c) * (30 + (i % 3) * 10); const answer = total * b / (a + b + c); return q('ratio-proportion', i, { text: `A bonus of ₹${total} is shared among A, B and C in the ratio ${a}:${b}:${c}. What is B's share?`, answer: `₹${answer}`, wrong: [`₹${total * a / (a + b + c)}`, `₹${total * c / (a + b + c)}`, `₹${total / 3}`], explanation: `Total parts = ${a + b + c}; B receives ${b}/${a + b + c} × ${total} = ₹${answer}.`, shortcut: `Find one ratio part first: ₹${total / (a + b + c)}.`, formulaIds: ['ratio-share'], tags: ['Ratio', 'Proportion', 'Distribution'] }); },
  average: i => { const n1 = 20 + i % 5; const n2 = 30 + i % 4; const a1 = 54 + i % 4 * 2; const a2 = 66 + i % 3 * 3; const answer = (n1 * a1 + n2 * a2) / (n1 + n2); return q('average', i, { text: `A team of ${n1} trainees has an average score of ${a1}; another team of ${n2} has an average of ${a2}. What is the combined average?`, answer: clean(answer), wrong: [clean((a1 + a2) / 2), clean(answer + 2), clean(answer - 2)], explanation: `Total score = ${n1}×${a1} + ${n2}×${a2} = ${n1 * a1 + n2 * a2}. Divide by ${n1 + n2}: ${clean(answer)}.`, shortcut: `A weighted average lies closer to the larger team’s average.`, formulaIds: ['average'], tags: ['Average', 'Weighted average', 'Ratio'] }); },
  'mixture-alligation': i => { const low = 20 + i % 4 * 5; const high = 50 + i % 3 * 10; const target = 35 + i % 3 * 5; const ratioLow = high - target; const ratioHigh = target - low; return q('mixture-alligation', i, { text: `In what ratio should a ${low}% solution and a ${high}% solution be mixed to obtain a ${target}% solution?`, answer: `${ratioLow}:${ratioHigh}`, wrong: [`${ratioHigh}:${ratioLow}`, `${target - low}:${high - target}`, '1:1'], explanation: `By alligation, quantities are in inverse difference ratio: (${high} − ${target}):(${target} − ${low}) = ${ratioLow}:${ratioHigh}.`, shortcut: `Cross-subtract the desired concentration from the two extremes.`, formulaIds: ['mixture'], tags: ['Mixture', 'Alligation', 'Ratio'] }); },
  'time-work': i => { const a = 8 + i % 4 * 2; const b = 12 + i % 4 * 3; const c = 24 + i % 3 * 6; const rate = 1 / a + 1 / b - 1 / c; const answer = 1 / rate; return q('time-work', i, { text: `A and B can finish a task in ${a} and ${b} days. A leak of work equivalent to completing the task in ${c} days is present. How long will the task take when all operate together?`, answer: `${clean(answer)} days`, wrong: [`${clean(a * b / (a + b))} days`, `${clean(c)} days`, `${clean(answer + 2)} days`], explanation: `Net daily work = 1/${a} + 1/${b} − 1/${c} = ${clean(rate)}. Time = 1/${clean(rate)} = ${clean(answer)} days.`, shortcut: `Treat the leak as a negative worker before inverting the net rate.`, formulaIds: ['time-work'], tags: ['Time & Work', 'Efficiency', 'Multi-concept'] }); },
  'pipes-cisterns': i => { const a = 8 + i % 4 * 2; const b = 12 + i % 3 * 4; const leak = 24 + i % 3 * 6; const rate = 1 / a + 1 / b - 1 / leak; const answer = 1 / rate; return q('pipes-cisterns', i, { text: `Pipe A fills a tank in ${a} hours, B in ${b} hours, and a leak empties it in ${leak} hours. How long to fill the tank if all are opened?`, answer: `${clean(answer)} hours`, wrong: [`${clean(a * b / (a + b))} hours`, `${leak} hours`, `${clean(answer + 2)} hours`], explanation: `Net rate = 1/${a} + 1/${b} − 1/${leak}; its reciprocal is ${clean(answer)} hours.`, shortcut: `Use a common denominator only once, then invert.`, formulaIds: ['pipes'], tags: ['Pipes', 'Rates', 'Negative work'] }); },
  'time-speed-distance': i => { const first = 40 + i % 4 * 10; const second = 60 + i % 3 * 10; const d = 120 + i % 3 * 30; const answer = 2 * first * second / (first + second); return q('time-speed-distance', i, { text: `A car covers equal distances at ${first} km/h and ${second} km/h. What is its average speed for the whole trip?`, answer: `${clean(answer)} km/h`, wrong: [`${clean((first + second) / 2)} km/h`, `${first} km/h`, `${second} km/h`], explanation: `For equal distances, average speed is 2ab/(a+b) = 2×${first}×${second}/(${first}+${second}) = ${clean(answer)} km/h.`, shortcut: `Never take the simple mean when the distances are equal but speeds differ.`, formulaIds: ['speed-distance-time'], tags: ['Speed', 'Average', 'Harmonic mean'] }); },
  'boats-streams': i => { const boat = 12 + i % 4 * 2; const stream = 2 + i % 3; const distance = 28 + i % 4 * 4; const totalTime = distance / (boat + stream) + distance / (boat - stream); return q('boats-streams', i, { text: `A boat's still-water speed is ${boat} km/h and stream speed is ${stream} km/h. How long does it take to travel ${distance} km downstream and return?`, answer: `${clean(totalTime)} hours`, wrong: [`${clean(2 * distance / boat)} hours`, `${clean(distance / (boat + stream))} hours`, `${clean(distance / (boat - stream))} hours`], explanation: `Downstream time = ${distance}/${boat + stream}; upstream time = ${distance}/${boat - stream}. Their sum is ${clean(totalTime)} hours.`, shortcut: `Write both legs separately; stream effects do not cancel in time.`, formulaIds: ['boats-streams'], tags: ['Boats', 'Streams', 'Speed'] }); },
  trains: i => { const l1 = 120 + i % 5 * 20; const l2 = 180 + i % 4 * 20; const v1 = 54 + i % 3 * 18; const v2 = 36 + i % 4 * 9; const answer = (l1 + l2) / ((v1 + v2) * 5 / 18); return q('trains', i, { text: `Two trains of lengths ${l1} m and ${l2} m move in opposite directions at ${v1} km/h and ${v2} km/h. In how many seconds do they cross?`, answer: `${clean(answer)} seconds`, wrong: [`${clean((l1 + l2) / ((v1 - v2) * 5 / 18))} seconds`, `${clean(l1 / (v1 * 5 / 18))} seconds`, `${clean(answer + 2)} seconds`], explanation: `Relative speed = (${v1}+${v2})×5/18 m/s. Distance = ${l1}+${l2} m, so time = ${clean(answer)} seconds.`, shortcut: `Opposite directions mean add both speeds after unit conversion.`, formulaIds: ['trains'], tags: ['Trains', 'Relative speed', 'Unit conversion'] }); },
  interest: i => { const p = 1000 + i % 4 * 500; const r = 10 + i % 3 * 5; const years = 2; const ci = p * ((1 + r / 100) ** years - 1); const si = p * r * years / 100; const answer = ci - si; return q('interest', i, { text: `What is the difference between compound interest and simple interest on ₹${p} at ${r}% per annum for ${years} years?`, answer: `₹${clean(answer)}`, wrong: [`₹${clean(si)}`, `₹${clean(ci)}`, `₹${clean(answer + r)}`], explanation: `SI = ₹${clean(si)}. CI = ₹${clean(ci)}. Difference = ₹${clean(ci - si)}.`, shortcut: `For two years, CI − SI = P(r/100)².`, formulaIds: ['simple-interest', 'compound-interest'], tags: ['Interest', 'Compound interest', 'Comparison'] }); },
  'number-system': i => { const base = 3 + i % 4; const exponent = 7 + i % 5; const divisor = 5 + i % 4; const answer = (base ** exponent) % divisor; return q('number-system', i, { text: `What is the remainder when ${base}^${exponent} is divided by ${divisor}?`, answer, wrong: [String((answer + 1) % divisor), String((answer + 2) % divisor), String(divisor - 1)], explanation: `Reduce powers modulo ${divisor}; the repeating remainder pattern gives ${answer}.`, shortcut: `Find the smallest repeating power cycle before expanding anything.`, formulaIds: ['number-system'], tags: ['Number system', 'Remainders', 'Cyclic powers'] }); },
  'lcm-hcf': i => { const hcf = 6 + i % 4 * 2; const m = 3 + i % 3; const n = 5 + i % 3; const a = hcf * m; const b = hcf * n; const lcm = hcf * m * n; return q('lcm-hcf', i, { text: `Two numbers have HCF ${hcf}; their quotients after dividing by the HCF are ${m} and ${n}, which are coprime. What is their LCM?`, answer: lcm, wrong: [a * b, hcf * (m + n), lcm + hcf], explanation: `Numbers are ${a} and ${b}. Since ${m} and ${n} are coprime, LCM = ${hcf}×${m}×${n} = ${lcm}.`, shortcut: `After factoring out the HCF, multiply only the coprime remainders.`, formulaIds: ['lcm-hcf'], tags: ['LCM', 'HCF', 'Prime factors'] }); },
  'permutation-combination': i => { const n = 7 + i % 4; const r = 3; const answer = n * (n - 1) * (n - 2) / 6; return q('permutation-combination', i, { text: `From ${n} applicants, how many three-member committees can be formed if order does not matter?`, answer, wrong: [n * (n - 1) * (n - 2), n * (n - 1) / 2, answer + n], explanation: `Committee selection uses combinations: ${n}C3 = ${n}×${n - 1}×${n - 2}/6 = ${answer}.`, shortcut: `Order is irrelevant for a committee, so divide permutations by 3!.`, formulaIds: ['permutation-combination'], tags: ['Combination', 'Counting'] }); },
  probability: i => { const red = 3 + i % 3; const blue = 4 + i % 4; const green = 2 + i % 3; const total = red + blue + green; const answer = red * (red - 1) / (total * (total - 1)); return q('probability', i, { text: `A bag has ${red} red, ${blue} blue and ${green} green balls. Two balls are drawn without replacement. What is the probability that both are red?`, answer: clean(answer), wrong: [clean((red / total) ** 2), clean(red / total), clean((red * (red - 1)) / total ** 2)], explanation: `P(red then red) = ${red}/${total} × ${red - 1}/${total - 1} = ${clean(answer)}.`, shortcut: `Without replacement, decrease both the favourable count and total for draw two.`, formulaIds: ['probability', 'permutation-combination'], tags: ['Probability', 'Without replacement', 'Combination'] }); },
  mensuration: i => { const radius = 7 + i % 4; const height = 10 + i % 3 * 5; const answer = 2 * Math.PI * radius * (radius + height); const display = clean(answer); return q('mensuration', i, { text: `Using π = 22/7, find the total surface area of a cylinder of radius ${radius} cm and height ${height} cm.`, answer: `${display} cm²`, wrong: [`${clean(Math.PI * radius * radius + 2 * Math.PI * radius * height)} cm²`, `${clean(2 * Math.PI * radius * height)} cm²`, `${clean(answer + 2 * Math.PI * radius * radius)} cm²`], explanation: `TSA = 2πr(r+h) = 2×π×${radius}×(${radius}+${height}) = ${display} cm².`, shortcut: `Factor 2πr before substituting.`, formulaIds: ['mensuration'], tags: ['Mensuration', 'Cylinder', 'Surface area'] }); }
};
const quantitativeQuestions = Object.fromEntries(Object.keys(quantBuilders).map(topic => [topic, Array.from({ length: 20 }, (_, index) => quantBuilders[topic](index))]));

const logicalAnswers = {
  'seating-arrangement': i => ({ text: `Five colleagues P, Q, R, S and T sit in a row facing north. P is immediately left of Q; R is at an end; S sits immediately right of Q. If T takes the remaining end, who sits in the middle?`, answer: 'Q', wrong: ['P', 'R', 'S'], explanation: `The only arrangement satisfying P-Q-S as a block with R and T at ends is R, P, Q, S, T (or its allowed end swap). Q is in the middle.`, tags: ['Seating', 'Linear arrangement'] }),
  'blood-relations': i => ({ text: `Pointing to a woman, Arjun says, “She is the daughter of my grandfather's only son.” How is the woman related to Arjun?`, answer: 'Sister', wrong: ['Mother', 'Cousin', 'Aunt'], explanation: `Grandfather's only son is Arjun's father; that man's daughter is Arjun's sister.`, tags: ['Blood relation', 'Family tree'] }),
  'direction-sense': i => { const steps = 6 + i % 4; return { text: `Meera walks ${steps} km north, turns right and walks ${steps - 2} km, then turns right and walks ${steps} km. In which direction is she from her starting point?`, answer: 'East', wrong: ['West', 'North', 'South'], explanation: `The north and south distances cancel. Her remaining displacement is ${steps - 2} km east.`, tags: ['Direction', 'Displacement'] }; },
  'coding-decoding': i => { const shift = 2 + i % 3; const word = 'CAMP'; const encoded = [...word].map(letter => String.fromCharCode(letter.charCodeAt(0) + shift)).join(''); return { text: `In a code, each letter is shifted ${shift} positions forward in the alphabet. How is CAMP written?`, answer: encoded, wrong: ['ECOQ', 'BNLO', 'DQOR'], explanation: `Shift C, A, M and P forward by ${shift}: ${encoded}.`, tags: ['Coding', 'Alphabet shift'] }; },
  syllogism: i => ({ text: `Statements: All analysts are readers. Some readers are runners. Conclusions: I. Some analysts are runners. II. Some runners are readers. Which conclusion follows?`, answer: 'Only II follows', wrong: ['Only I follows', 'Both I and II follow', 'Neither follows'], explanation: `“Some readers are runners” guarantees that some runners are readers. It does not connect analysts to runners.`, tags: ['Syllogism', 'Venn logic'] }),
  'statement-conclusion': i => ({ text: `Statement: The library has extended its weekday hours during examinations. Conclusions: I. Students may use the library later on weekdays. II. The library will remain open all night. Which conclusion follows?`, answer: 'Only I follows', wrong: ['Only II follows', 'Both follow', 'Neither follows'], explanation: `Extended hours supports I. “All night” is not stated, so II does not follow.`, tags: ['Statement', 'Conclusion'] }),
  'statement-assumption': i => ({ text: `Statement: “Install the update before submitting your application,” says the portal notice. Assumptions: I. The update may affect submission. II. Every applicant has already installed it. Which assumption is implicit?`, answer: 'Only I is implicit', wrong: ['Only II is implicit', 'Both are implicit', 'Neither is implicit'], explanation: `The instruction is meaningful only if the update can matter. It does not assume everyone has already installed it.`, tags: ['Statement', 'Assumption'] }),
  'data-sufficiency': i => ({ text: `What is the value of x? I. x + y = 12. II. y = 5.`, answer: 'Both statements together are sufficient', wrong: ['Statement I alone is sufficient', 'Statement II alone is sufficient', 'Either statement alone is sufficient'], explanation: `I has two unknowns; II gives y only. Together, x = 12 − 5 = 7.`, tags: ['Data sufficiency', 'Algebra'] }),
  'ranking-ordering': i => { const top = 8 + i % 5; const bottom = 13 + i % 4; const total = top + bottom - 1; return { text: `In a class, Dev is ${top}th from the top and ${bottom}th from the bottom. How many students are in the class?`, answer: String(total), wrong: [String(top + bottom), String(top * bottom), String(total - 1)], explanation: `Dev is counted from both ends, so total = ${top} + ${bottom} − 1 = ${total}.`, tags: ['Ranking', 'Ordering'] }; },
  series: i => { const start = 3 + i; const seq = [start, start * 2 + 1, (start * 2 + 1) * 2 + 1]; const answer = seq[2] * 2 + 1; return { text: `Find the next term: ${seq.join(', ')}, ?`, answer: String(answer), wrong: [String(seq[2] + 2), String(seq[2] * 2), String(answer + 3)], explanation: `Each term is previous × 2 + 1. Thus ${seq[2]}×2+1 = ${answer}.`, tags: ['Series', 'Pattern'] }; },
  analogy: i => ({ text: `“Algorithm : Procedure” is most analogous to:`, answer: 'Blueprint : Plan', wrong: ['Compiler : Error', 'Keyboard : Screen', 'Database : Query'], explanation: `An algorithm is a defined procedure; a blueprint is a defined plan. The relation is definition/representation, not use or opposition.`, tags: ['Analogy', 'Verbal logic'] }),
  'logical-deduction': i => ({ text: `Every shortlisted candidate cleared the aptitude test. Nila is shortlisted. What must be true?`, answer: 'Nila cleared the aptitude test', wrong: ['Everyone who cleared is shortlisted', 'Nila topped the test', 'No one else cleared the test'], explanation: `Apply the universal condition directly to Nila. The converse and stronger claims are not justified.`, tags: ['Deduction', 'Conditional logic'] })
};
const logicalQuestions = Object.fromEntries(Object.keys(logicalAnswers).map(topic => [topic, Array.from({ length: 20 }, (_, index) => {
  const item = logicalAnswers[topic](index);
  return advancedQuestion({ id: `advanced-${topic}-${String(index + 1).padStart(3, '0')}`, topic, index, category: 'logical_reasoning', ...item, estimatedTimeSeconds: 100 });
})]));

const diDefinitions = [
  ['table', 'Quarterly revenue (₹ lakh)', ['Aster', 'Banyan', 'Cedar', 'Dune'], [48, 60, 54, 72]], ['bar', 'Campus hires by department', ['Engineering', 'Sales', 'Support', 'Finance'], [84, 56, 44, 36]], ['line', 'Monthly orders (thousands)', ['Jan', 'Feb', 'Mar', 'Apr'], [32, 40, 44, 52]], ['pie', 'Training budget allocation (₹ lakh)', ['Technical', 'Communication', 'Mentoring', 'Tools'], [42, 28, 18, 12]], ['mixed', 'Applicants clearing each round', ['Screening', 'Aptitude', 'Technical', 'HR'], [360, 240, 144, 108]], ['caselet', 'Project hours by workstream', ['Research', 'Build', 'Testing', 'Review'], [90, 210, 120, 60]], ['missing-data', 'Regional sales index', ['North', 'South', 'East', 'West'], [75, 90, 105, 120]]
];
const diQuestions = diDefinitions.flatMap(([visualType, title, labels, values], setIndex) => {
  const setId = `di-${visualType}`; const context = { visualType, title, labels, values, unit: title.match(/₹/) ? '₹ lakh' : '' }; const total = values.reduce((sum, value) => sum + value); const max = Math.max(...values); const min = Math.min(...values); const difference = max - min; const increase = (values[values.length - 1] - values[0]) / values[0] * 100;
  const prompts = [
    { text: `What is the total shown in the dataset?`, answer: clean(total), wrong: [clean(total - values[0]), clean(total + values[1]), clean(max)], explanation: `${values.join(' + ')} = ${total}.` },
    { text: `Which label has the highest value?`, answer: labels[values.indexOf(max)], wrong: labels.filter(label => label !== labels[values.indexOf(max)]).slice(0, 3), explanation: `${labels[values.indexOf(max)]} is highest at ${max}.` },
    { text: `What is the difference between the highest and lowest values?`, answer: clean(difference), wrong: [clean(max + min), clean(max / min), clean(difference + 10)], explanation: `${max} − ${min} = ${difference}.` },
    { text: `What is the percentage change from ${labels[0]} to ${labels[labels.length - 1]}?`, answer: `${clean(increase)}%`, wrong: [`${clean(values[values.length - 1] - values[0])}%`, `${clean((values[values.length - 1] / values[0]) * 100)}%`, `${clean(increase + 10)}%`], explanation: `Change = (${values[values.length - 1]} − ${values[0]})/${values[0]} × 100 = ${clean(increase)}%.` }
  ];
  return prompts.map((item, index) => advancedQuestion({ id: `advanced-data-interpretation-${visualType}-${String(index + 1).padStart(3, '0')}`, category: 'data_interpretation', topic: 'data-interpretation', index, ...item, shortcut: index === 3 ? 'Use the first value as the denominator for a percentage change.' : null, formulaIds: ['data-interpretation'], tags: ['Data interpretation', visualType, index === 3 ? 'Percentage' : 'Comparison'], estimatedTimeSeconds: 110, setId, setContext: context }));
});

const puzzleDefinitions = [
  ['linear-seating', 'Linear seating puzzle', 'A, B, C, D, E and F sit in a row. B is immediately to the right of A; D is immediately to the left of E; C is at the left end; F is at the right end.', ['C', 'A', 'B', 'D', 'E', 'F']],
  ['circular-seating', 'Circular seating puzzle', 'P, Q, R, S, T and U sit around a circle facing the centre, beginning with P at the reference position and moving clockwise. P sits opposite S; Q and R are immediately clockwise of P; T is immediately clockwise of S; U takes the remaining position.', ['P', 'Q', 'R', 'S', 'T', 'U']],
  ['floor', 'Floor puzzle', 'A, B, C, D and E live on consecutive floors 1–5. C lives on floor 1, B on floor 2, A lives above B, and D lives immediately below E.', ['C', 'B', 'A', 'D', 'E']],
  ['scheduling', 'Scheduling puzzle', 'Four interviews are scheduled Monday to Thursday. Design is before Coding; HR is Thursday; Aptitude is immediately after Design.', ['Design', 'Aptitude', 'Coding', 'HR']],
  ['distribution', 'Distribution puzzle', 'Five folders A–E are assigned one each to Monday–Friday. A is before B, C is on Monday, D is immediately before E, and B is not Tuesday.', ['C', 'A', 'B', 'D', 'E']],
  ['selection', 'Selection puzzle', 'Exactly three of A, B, C, D and E are selected. A, B and E are selected; C and D are not selected.', ['A', 'B', 'E']],
  ['ranking', 'Ranking puzzle', 'Five candidates K, L, M, N and O have distinct ranks. K ranks above L; M ranks first; N ranks immediately below O; L is last.', ['M', 'K', 'O', 'N', 'L']]
];
const puzzleQuestions = puzzleDefinitions.flatMap(([setId, title, contextText, order], setIndex) => {
  const asks = [
    { text: `Who is in the first position / earliest slot?`, answer: order[0], wrong: order.slice(1, 4), explanation: `From the constraints, the resolved order is ${order.join(', ')}; ${order[0]} is first.` },
    { text: `Who is in the final position / latest slot?`, answer: order.at(-1), wrong: order.slice(0, 3), explanation: `The resolved order is ${order.join(', ')}; ${order.at(-1)} is last.` },
    { text: `Who occupies the middle position?`, answer: order[Math.floor(order.length / 2)], wrong: order.filter((_, idx) => idx !== Math.floor(order.length / 2)).slice(0, 3), explanation: `The middle of ${order.join(', ')} is ${order[Math.floor(order.length / 2)]}.` },
    { text: `Who is immediately after ${order[1]}?`, answer: order[2], wrong: [order[0], order[3] || order[0], order.at(-1)], explanation: `In the resolved arrangement ${order.join(', ')}, ${order[2]} follows ${order[1]}.` }
  ];
  return asks.map((item, index) => advancedQuestion({ id: `advanced-puzzle-${setId}-${String(index + 1).padStart(3, '0')}`, category: 'puzzles', topic: 'advanced-puzzles', index: setIndex + index, ...item, shortcut: 'Place the fixed positions and adjacent pairs before testing the remaining possibilities.', tags: ['Puzzle', title], estimatedTimeSeconds: 150, setId: `puzzle-${setId}`, setContext: { visualType: 'puzzle', title, text: contextText } }));
});

const verbalBanks = {
  'reading-comprehension': ['A concise report argues that internship reflection improves learning when feedback is specific.', 'Which inference is best supported?', 'Specific feedback supports the value of reflection.', 'Feedback is unnecessary', 'All internships are identical', 'Reflection replaces work'],
  'para-jumbles': ['Choose the most coherent order: P. It reduced deployment risk. Q. The team first added automated tests. R. They then released in smaller batches.', 'Q-R-P', 'P-Q-R', 'R-P-Q', 'Q-P-R'],
  'sentence-correction': ['Choose the grammatically correct sentence.', 'Each of the candidates has submitted a portfolio.', 'Each of the candidates have submitted a portfolio.', 'Each candidates has submitted a portfolio.', 'Each of candidate have submitted a portfolio.'],
  'error-detection': ['Identify the part with an error: “Neither the mentor nor the interns was available.”', 'was available', 'Neither the mentor', 'nor the interns', 'No error'],
  'sentence-completion': ['The analyst verified the figures twice to ______ the risk of an error.', 'minimise', 'magnify', 'postpone', 'ignore'],
  'vocabulary-context': ['In “The manager gave a pragmatic response,” pragmatic most nearly means:', 'practical', 'emotional', 'uncertain', 'ornamental'],
  'synonyms-antonyms': ['Choose the synonym of “meticulous”.', 'careful', 'careless', 'brief', 'unclear'],
  'fill-in-the-blanks': ['The prototype was ______ enough to test, though not ready for release.', 'stable', 'random', 'silent', 'ancient'],
  'critical-reasoning': ['A team says shorter meetings improved output. Which fact most strengthens the claim?', 'The team used the saved time for focused work.', 'The office changed paint colours.', 'Some meetings were held outdoors.', 'Output was not measured.']
};
const verbalQuestions = Object.fromEntries(Object.entries(verbalBanks).map(([topic, bank]) => [topic, Array.from({ length: 8 }, (_, index) => advancedQuestion({ id: `advanced-${topic}-${String(index + 1).padStart(3, '0')}`, category: 'verbal_ability', topic, index, text: bank[0], answer: bank[2], wrong: bank.slice(3, 6), explanation: `${bank[2]} is the only option that correctly addresses the wording and meaning of the prompt.`, shortcut: null, tags: ['Verbal ability', advancedTopics.find(item => item.id === topic)?.name || 'Language'], estimatedTimeSeconds: 75 }))]));

export const advancedQuestionGroups = { ...quantitativeQuestions, 'data-interpretation': diQuestions, ...logicalQuestions, 'advanced-puzzles': puzzleQuestions, ...verbalQuestions };
export const allAdvancedQuestions = Object.values(advancedQuestionGroups).flat();
export const advancedQuestionById = id => allAdvancedQuestions.find(question => question.id === id);
export const advancedTopicById = id => advancedTopics.find(topic => topic.id === id);
export const questionsForAdvancedTopic = id => advancedQuestionGroups[id] || null;
export const advancedMocks = [
  { id: 'placement-mock-01', name: 'Placement Mock 01', durationMinutes: 30, description: 'A timed, mixed placement-style assessment. Original CareerForge questions; not a company paper.' },
  { id: 'placement-mock-02', name: 'Placement Mock 02', durationMinutes: 30, description: 'A fresh timed, mixed placement-style assessment. Original CareerForge questions; not a company paper.' },
  { id: 'placement-mock-03', name: 'Placement Mock 03', durationMinutes: 30, description: 'A fresh timed, mixed placement-style assessment. Original CareerForge questions; not a company paper.' }
];
const pick = (questions, count, offset) => Array.from({ length: count }, (_, index) => questions[(offset + index) % questions.length]);
export const questionsForMock = mockId => {
  const index = advancedMocks.findIndex(mock => mock.id === mockId);
  if (index < 0) return null;
  const quant = Object.keys(quantitativeQuestions).flatMap(topic => quantitativeQuestions[topic]);
  const logical = Object.values(logicalQuestions).flat();
  const verbal = Object.values(verbalQuestions).flat();
  return [...pick(quant, 10, index * 11), ...pick(logical, 10, index * 13), ...pick(verbal, 10, index * 7)].map(question => ({ ...question, section: question.category === 'quantitative' ? 'Quantitative' : question.category === 'logical_reasoning' ? 'Logical Reasoning' : 'Verbal' }));
};
export const questionsForDailyChallenge = date => {
  const serial = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);
  const quant = quantitativeQuestions.probability[serial % 20];
  const logic = logicalQuestions['direction-sense'][serial % 20];
  const verbal = verbalQuestions['critical-reasoning'][serial % 8];
  return [quant, logic, verbal];
};

export function validateAdvancedCatalog() {
  const errors = [];
  for (const question of allAdvancedQuestions) {
    if (question.options.length !== 4 || new Set(question.options).size !== 4 || question.correctAnswer < 0 || question.correctAnswer > 3 || !question.explanation) errors.push(question.id);
  }
  if (Object.values(quantitativeQuestions).some(list => list.length !== 20)) errors.push('quantitative-count');
  if (Object.values(logicalQuestions).some(list => list.length !== 20)) errors.push('logical-count');
  return errors;
}
