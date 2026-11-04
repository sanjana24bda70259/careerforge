import { csFundamentals } from './csFundamentalsCatalog.js';

const drills = [
  ['Explain', 'Explain this idea to a beginner in your own words.', 'Define the terms, state the rule accurately, and avoid circular definitions.'],
  ['Demonstrate', 'Give a concrete example with values or a small diagram that demonstrates this rule.', 'Show an initial state, the operation, and the resulting state.'],
  ['Debug', 'Describe a bug caused by misunderstanding this rule and explain its correction.', 'Identify the wrong assumption, its visible symptom, and the smallest valid fix.'],
  ['Test', 'Design two tests that distinguish a correct implementation from an incorrect one.', 'Include a normal case and a boundary or failure case, each with its expected result.'],
  ['Compare', 'Contrast this approach with a plausible alternative. When would each be useful?', 'Compare correctness, cost and constraints; explain one situation where the alternative wins.'],
  ['Apply', 'Apply this principle to a student course-registration application.', 'Name the relevant component, show how the rule applies, and state the assumptions.'],
  ['Challenge', 'State the assumptions behind this claim. Describe what changes if one assumption fails.', 'Separate the guaranteed behavior from implementation choices and invalid inputs.'],
  ['Review', 'Write a short code-review comment explaining a violation of this rule.', 'Show a concrete violation and a correction with a technical reason.'],
  ['Measure', 'How would you observe or verify this behavior in a small experiment?', 'Specify setup, expected evidence, and a result that would falsify your explanation.'],
  ['Teach', 'Write a 60-second interview answer and anticipate one difficult follow-up.', 'Use a clear definition and example, then answer the follow-up without inventing guarantees.']
];
function writtenTopic(id,title,category,anchors, domain='cs', count=60) {
  return { id,title,category,domain,format:'written', theory: anchors.join('\n\n'), questions:Array.from({length:count},(_,i)=>{
    const anchor=anchors[i%anchors.length], [label,prompt,rubric]=drills[Math.floor(i/anchors.length)%drills.length];
    return {id:`written-${id}-${i+1}`,prompt:`${label}: ${anchor}\n\n${prompt}`, explanation:`Reference principle: ${anchor}\n\nReview checklist: ${rubric}`,difficulty:'Written practice'};
  }) };
}
const languages = {
  c: ['C Programming', [
    'Array indices run from 0 to length−1; out-of-bounds access has undefined behavior.',
    'A pointer stores an address; dereferencing requires a valid live object of a suitable type.',
    'Integer division truncates toward zero. Check a divisor before division.',
    'A C string ends at the first null character; its buffer must include space for that terminator.',
    'malloc can fail and returns uninitialized storage; every owned allocation needs a matching free.',
    'A local automatic variable ceases to exist when its block ends; do not return a pointer to it.',
    'Function arguments are passed by value. Pass a pointer when the function must update a caller-owned value.',
    'A struct groups named fields; field layout may include padding.',
    'Signed integer overflow is undefined behavior; check bounds before arithmetic.',
    'Use fgets with a buffer bound and check its return value before consuming input.',
    'A header declares interfaces; compiling and linking definitions are separate steps.',
    'File operations can fail. Check open, read, write and close results as appropriate.'
  ]],
  cpp: ['C++',[
    'RAII ties resource lifetime to object lifetime so destructors release owned resources.',
    'std::vector may reallocate on growth and invalidate pointers, references and iterators to its elements.',
    'A reference aliases an existing object; it does not extend every referenced object’s lifetime.',
    'A virtual function supports runtime dispatch through a base pointer or reference.',
    'A polymorphic base normally needs a virtual destructor when deletion through the base is allowed.',
    'unique_ptr models unique ownership; shared_ptr models shared ownership with reference counting.',
    'Passing a large object by const reference can avoid a copy while preventing mutation through that reference.',
    'std::map provides ordered keys; std::unordered_map uses hashing and has average constant-time lookup.',
    'A template describes a family of types or functions instantiated for particular types.',
    'A move can transfer resources; a moved-from standard-library object remains valid but its value may be unspecified.',
    'An exception unwinds scopes and destroys fully constructed automatic objects.',
    'A sorting comparator must satisfy strict weak ordering, including returning false for equal elements.'
  ]],
  csharp: ['C#',[
    'Value-type assignment copies a value; reference-type assignment copies a reference to an object.',
    'An interface specifies a contract that multiple types can implement.',
    'Properties expose accessors and can enforce validation rather than exposing mutable fields.',
    'A nullable value type can hold a value or null; check before accessing its Value.',
    'A using statement disposes an IDisposable resource even when the enclosed code throws.',
    'async and await allow asynchronous composition; they do not automatically create a new thread.',
    'Many LINQ queries use deferred execution and are evaluated when enumerated.',
    'Dictionary<TKey,TValue> requires stable equality and hash behavior for stored keys.',
    'A string is immutable; concatenation creates new strings.',
    'Catch the exception types you can handle and preserve useful diagnostic information.',
    'An event lets a publisher notify subscribers; retained subscriptions can extend object lifetimes.',
    'A lock protects a critical section only when all competing accesses coordinate on the same lock.'
  ]],
  java: ['Java',[
    'Java passes arguments by value, including the value of an object reference.',
    'equals compares logical equality when overridden; == on object references compares identity.',
    'Equal objects must have equal hashCode values; mutable map keys can break lookup expectations.',
    'A String is immutable; StringBuilder supports repeated changes to a character sequence.',
    'An ArrayList provides indexed access and amortized constant-time append, but insertion may shift elements.',
    'A HashMap permits one null key; its iteration order is not guaranteed.',
    'Overloading selects among signatures; overriding changes inherited instance-method behavior.',
    'A finally block normally runs on leaving a try, but process termination can prevent it.',
    'Try-with-resources closes AutoCloseable resources in reverse declaration order.',
    'Generics provide compile-time type checking; most generic type information is erased at runtime.',
    'A synchronized region provides mutual exclusion and visibility when threads use the same monitor.',
    'A stream pipeline generally runs when a terminal operation is invoked; a stream cannot be reused after consumption.'
  ]]
};
export const csPractice = [
  ...csFundamentals.flatMap(subject=>subject.topics.map(topic=>writtenTopic(`${subject.id}-${topic.id}`,topic.title,subject.name,
    [...new Set([topic.overview,...topic.notes,...topic.quiz.map(q=>q.explanation)])].slice(0,6)))),
  ...Object.entries(languages).map(([id,[title,anchors]])=>writtenTopic(id,title,'Programming Languages',anchors))
];
// Existing subjects can have fewer than six unique anchors. Build 60 distinct drills
// by cycling the ten prompts over all anchors, without repeating a question.
for (const topic of csPractice) {
  const seen = new Set();
  topic.questions = topic.questions.filter(q=>{if(seen.has(q.prompt))return false;seen.add(q.prompt);return true;});
  if(topic.questions.length<60) {
    const anchors=topic.theory.split('\n\n');
    for(let i=topic.questions.length;i<60;i++) {
      const anchor=anchors[i%anchors.length];
      topic.questions.push({id:`written-${topic.id}-${i+1}`,prompt:`Design review ${i-topic.questions.length+1}: ${anchor}\n\nExplain how you would apply this to ${['an online store','a booking service','a library system','a chat application','a file-processing tool','a bank ledger'][Math.floor(i/anchors.length)%6]}. Include a failure case and a test.`,explanation:`Reference principle: ${anchor}\n\nIdentify an appropriate component, justify your assumptions, show the failure and state the expected test result.`,difficulty:'Written practice'});
    }
  }
}

const hr = [
  'introducing yourself for your first software role','explaining a project you are proud of','discussing a deadline you missed','handling disagreement with a teammate','learning an unfamiliar technology','taking ownership of a mistake','receiving critical feedback','prioritizing two urgent assignments','working with an unresponsive teammate','explaining a gap in your experience','choosing a company and role','asking the interviewer thoughtful questions'
];
const gd = [
  'Should universities allow AI tools in assignments?','Remote work or office work for new graduates?','Should coding interviews use take-home projects?','How can cities reduce traffic congestion?','Should digital literacy be compulsory in schools?','Is a four-day working week practical?','How should social platforms handle misinformation?','Should public transport be free?','Skills or degrees: what should hiring prioritize?','How can companies reduce electronic waste?','Should schools teach personal budgeting?','How should teams balance speed and software quality?'
];
const technical = [
  'an API returning duplicate orders after a retry','a web page whose load time doubled','a SQL query returning unexpected duplicate rows','a deadlock between two worker threads','a cache returning stale product prices','a memory leak in a long-running service','a failing HTTPS connection','a login endpoint receiving repeated guesses','a deployment that broke an old mobile client','a race condition in ticket booking','a database index slowing down writes','a background job losing work after a restart'
];
const placement = [
  'a timed quantitative round','a logical reasoning round','a reading-comprehension round','a beginner programming round','an SQL assessment','a debugging exercise','an OOP discussion','a database-design exercise','an operating-systems quiz','a networking quiz','a project presentation','a behavioral interview'
];
const interviewSet = (id,title,scenarios,probes) => ({id,title,category:title,domain:'interview',format:'written',theory:'Prepare your own response, then compare it with the review checklist. These are original practice prompts; no company paper or automated interview score is claimed.',questions:scenarios.flatMap((scenario,s)=>probes.map(([prompt,rubric],p)=>({id:`interview-${id}-${s+1}-${p+1}`,prompt:`${scenario}\n\n${prompt}`,explanation:rubric,difficulty:'Interview practice'})))});
export const interviewPractice = [
  interviewSet('hr','HR Interview',hr.map(s=>`Prepare for ${s}.`),[
    ['Give a concise, honest answer using a real example.','Use situation, task, your action and result. Clearly separate your contribution from the team’s.'],
    ['What follow-up question might expose a weak part of your answer? Answer it.','Identify a missing detail, then support it with specific evidence and admit what you do not know.'],
    ['Rewrite the answer in 60 seconds for someone outside your field.','Remove jargon, state why the example matters, and retain a concrete outcome.'],
    ['What would you do differently if the situation happened again?','Name one controllable change and explain how you would evaluate its effect.'],
    ['How does this example connect to the role you want?','Connect an actual responsibility to evidence from your example. Avoid inventing achievements.']]),
  interviewSet('group-discussion','Group Discussion',gd,[
    ['Give a balanced opening statement with a clear position.','Define the scope, make one claim, give a reason, and acknowledge a trade-off.'],
    ['Present the strongest argument against your initial position.','Represent the opposing view fairly and identify circumstances where it is persuasive.'],
    ['Respond respectfully to a participant who disagrees.','Acknowledge their point, explain the disagreement, and invite a concrete example.'],
    ['What evidence would help the group reach a decision?','Specify relevant measures and sources without inventing statistics.'],
    ['Summarize the discussion and propose a practical next step.','Separate agreement from unresolved issues and propose a feasible, measurable action.']]),
  interviewSet('technical','Technical Interview',technical.map(s=>`Investigate ${s}.`),[
    ['What clarifying questions would you ask before proposing a fix?','Ask about reproduction, scope, timing, recent changes and expected behavior.'],
    ['Propose a likely cause and an experiment that could disprove it.','State a testable hypothesis, expected observations, and an alternative explanation.'],
    ['Describe a minimal fix and the trade-offs it introduces.','Preserve correctness, consider concurrency and failures, and explain costs.'],
    ['Design a regression test and a boundary case.','Make the original failure reproducible and assert observable behavior.'],
    ['How would you roll out and monitor the fix?','Use staged rollout, a rollback plan, error/latency metrics and correctness checks.']]),
  interviewSet('placement-papers','Placement Papers · Practice',placement.map(s=>`Plan and rehearse ${s}.`),[
    ['Create one representative question and solve it, showing your reasoning.','State a complete problem, solve it step by step, and verify the result independently.'],
    ['What common mistake can occur in this round? Demonstrate and correct it.','Give a concrete error, its cause, and a reliable check that catches it.'],
    ['Explain your approach to managing a 20-minute round.','Budget reading, solving and review time; prioritize by expected value rather than guesses.'],
    ['Design a harder variation and explain what changes in your approach.','Change one meaningful constraint and show why the original approach needs adjustment.'],
    ['Review your performance using an explicit checklist.','Review correctness, clarity, time and edge cases. Record one specific improvement.']])
];
