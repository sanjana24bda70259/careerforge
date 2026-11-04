import test from 'node:test';
import assert from 'node:assert/strict';
import { arrayPhases, buildTopicMap, questionKey } from '../../shared/dsaLearningMap.mjs';
import { dsaPracticeCatalog } from './dsaPracticeCatalog.js';

const topics = Object.entries(dsaPracticeCatalog).map(([id, questions]) => ({ id, name:id, questions:questions.map(q => ({...q,status:'not_started'})) }));
const arrays = topics.find(t => t.id === 'arrays');

test('curated Array map resolves every reference, covers the topic once and starts with traversal', () => {
  const refs = new Set(topics.flatMap(t => t.questions.map(q => `${t.id}:${q.id}`)));
  for (const phase of arrayPhases) for (const b of phase.branches) for (const ref of b.refs) assert(refs.has(ref), `Missing question: ${ref}`);
  const map = buildTopicMap(arrays, topics);
  assert.equal(map.phases.length,5);
  assert.equal(map.recommendation.question.id,'array-traversal');
  const mapped = map.phases.flatMap(p => p.branches.flatMap(b => b.questions.map(q => `${q.topic}:${q.id}`)));
  assert.equal(new Set(mapped).size,mapped.length);
  for (const q of arrays.questions) assert(mapped.includes(`arrays:${q.id}`),q.id);
  assert.equal(map.done,0);
});

test('recommendations advance through real progress and undo returns to the earliest unfinished skill', () => {
  const items = {};
  let map = buildTopicMap(arrays,topics,items);
  const order = [];
  while (map.recommendation) {
    const q = map.recommendation.question;
    order.push(q);
    items[questionKey(q.topic,q.id)] = {practised:true};
    map = buildTopicMap(arrays,topics,items);
    assert.equal(map.done,order.length);
    assert(order.length <= map.total);
  }
  assert(map.phases.every(p => p.complete));
  delete items[questionKey(order[0].topic,order[0].id)];
  assert.equal(buildTopicMap(arrays,topics,items).recommendation.question.id,'array-traversal');
});

test('bookmarks and unrelated records never count as practice; accepted solutions do', () => {
  const items = {'dsa:arrays:array-traversal':{bookmarked:true},'dsa:arrays:not-real':{practised:true}};
  assert.equal(buildTopicMap(arrays,topics,items).done,0);
  const acceptedTopics = topics.map(t => ({...t,questions:t.questions.map(q => ({...q,status:t.id==='arrays' && q.id==='array-traversal'?'solved':q.status}))}));
  const map = buildTopicMap(acceptedTopics.find(t=>t.id==='arrays'),acceptedTopics,items);
  assert.equal(map.done,1);
  assert.equal(map.recommendation.question.id,'linear-search');
});

test('every topic map covers every question and handles empty topics', () => {
  for (const topic of topics) {
    const map = buildTopicMap(topic,topics);
    const keys = map.phases.flatMap(p => p.branches.flatMap(b => b.questions.map(q => `${q.topic}:${q.id}`)));
    for (const q of topic.questions) assert(keys.includes(`${topic.id}:${q.id}`));
  }
  assert.equal(buildTopicMap({id:'empty',questions:[]},[]).recommendation,null);
});
