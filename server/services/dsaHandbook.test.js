import test from 'node:test';
import assert from 'node:assert/strict';
import { handbook, handbookById, patternForQuestion, patternForBranch } from '../../shared/dsaHandbook.mjs';
import { companySources, dsaCompanies, dsaCompanyGroups } from '../../shared/dsaCompanies.mjs';
import { dsaPracticeCatalog } from './dsaPracticeCatalog.js';
import { buildTopicMap } from '../../shared/dsaLearningMap.mjs';

const topics = Object.entries(dsaPracticeCatalog).map(([id,questions]) => ({id,name:id,questions}));
const refs = new Set(topics.flatMap(t => t.questions.map(q => `${t.id}:${q.id}`)));
test('every chapter has a usable ladder, trace, quiz and acyclic prerequisites', () => {
  assert.equal(new Set(handbook.map(c => c.id)).size, handbook.length);
  for (const c of handbook) {
    assert(c.example.trace.length >= 2, c.id);
    assert(c.quiz.correct >= 0 && c.quiz.correct < c.quiz.options.length, c.id);
    for (const ref of c.ladder) assert(refs.has(ref), `${c.id}: missing ${ref}`);
    const visit = (id, path = []) => {
      assert(!path.includes(id), `Prerequisite cycle: ${id}`);
      const chapter = handbookById(id); assert(chapter, id);
      for (const before of chapter.prerequisites) visit(before, [...path,id]);
    };
    visit(c.id);
  }
});
test('every question and map branch resolves to a chapter without confusing unrelated prefixes', () => {
  for (const topic of topics) {
    for (const q of topic.questions) assert(handbookById(patternForQuestion(topic.id,q)), q.id);
    for (const phase of buildTopicMap(topic,topics).phases) for (const branch of phase.branches) assert(handbookById(patternForBranch(topic.id,branch)), branch.id);
  }
  assert.equal(patternForQuestion('strings',{id:'longest-common-prefix'}),'linear-scan');
  assert.equal(patternForQuestion('tries',{id:'trie-insert-search-prefix'}),'tries');
  assert.equal(patternForQuestion('arrays',{id:'subarray-sum-k'}),'prefix-sums');
  assert.equal(patternForQuestion('recursion',{id:'reverse-array-recursive'}),'recursion');
});
test('company mappings have real local questions, linked evidence and explicit relationship labels', () => {
  assert.equal(new Set(dsaCompanies.map(c => c.id)).size,dsaCompanies.length);
  const grouped = dsaCompanyGroups.flatMap(group => group.companyIds);
  assert.deepEqual(new Set(grouped), new Set(dsaCompanies.map(c => c.id)), 'Every company belongs to one catalog group');
  assert.equal(grouped.length, dsaCompanies.length, 'Companies must not be duplicated across groups');
  for (const company of dsaCompanies) for (const q of company.questions) {
    assert(refs.has(q.ref), `${company.id}: ${q.ref}`);
    assert(handbookById(q.pattern), q.pattern);
    assert(companySources[q.source]?.url.startsWith('https://leetcode.com/discuss/post/'), q.source);
    assert(['reported','variant','related'].includes(q.match));
    if (q.match !== 'reported') assert(q.note.length > 20, q.title);
    assert(!('frequency' in q), 'No unverified frequency claims');
  }
});
