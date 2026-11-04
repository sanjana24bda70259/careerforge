import test from 'node:test';
import assert from 'node:assert/strict';
import { practiceTopics, practiceTopic, reviewPractice } from './practiceCatalog.js';
import { dsaResources } from '../../shared/dsaResources.mjs';
import { dsaPracticeCatalog } from './dsaPracticeCatalog.js';
import { divisorEditorial } from '../../shared/dsaTheory.mjs';
import vm from 'node:vm';
import { progressMetrics } from './workspaceService.js';
import { buildPersonalRoadmap } from './personalRoadmapService.js';

test('all practice topics have 60+ distinct questions, stable IDs, and complete review material',()=>{
  assert.equal(new Set(practiceTopics.map(t=>`${t.domain}:${t.id}`)).size,practiceTopics.length);
  for(const t of practiceTopics){
    assert(t.questions.length>=60,t.id);
    assert.equal(new Set(t.questions.map(q=>q.id)).size,t.questions.length,t.id);
    assert.equal(new Set(t.questions.map(q=>q.prompt)).size,t.questions.length,t.id);
    for(const q of t.questions){
      assert(q.prompt.trim()&&q.explanation.trim(),q.id);
      if(t.format==='mcq'){
        assert.equal(q.options.length,4,q.id);assert.equal(new Set(q.options).size,4,q.id);
        assert(Number.isInteger(q.correctAnswer)&&q.correctAnswer>=0&&q.correctAnswer<4,q.id);
      }
    }
  }
  assert.deepEqual(new Set(practiceTopics.filter(t=>t.domain==='aptitude').map(t=>t.category)),new Set(['Arithmetic Aptitude','Data Interpretation','Logical Reasoning','Verbal Reasoning','Verbal Ability','Nonverbal Reasoning']));
  for(const id of ['c','cpp','csharp','java'])assert(practiceTopic('cs',id));
  assert.equal(practiceTopic('interview','placement-papers').questions.length,60);
});
test('answer review rejects invalid and cross-topic answers and never scores written responses',()=>{
  const topic=practiceTopic('aptitude','percentages'),q=topic.questions[0];
  assert.equal(reviewPractice(topic,[{questionId:q.id,answer:q.correctAnswer}])[0].correct,true);
  assert.equal(reviewPractice(topic,[{questionId:q.id,answer:(q.correctAnswer+1)%4}])[0].correct,false);
  for(const answers of [[],[{questionId:q.id,answer:'0'}],[{questionId:q.id,answer:4}],[{questionId:'missing',answer:0}],[{questionId:q.id,answer:0},{questionId:q.id,answer:1}]])assert.throws(()=>reviewPractice(topic,answers));
  const written=practiceTopic('cs','java');
  const r=reviewPractice(written,[{questionId:written.questions[0].id,answer:'A reference is passed by value; reassignment does not rebind the caller.'}])[0];
  assert.equal(r.correct,null);assert.equal(r.correctAnswer,undefined);
  assert.throws(()=>reviewPractice(written,[{questionId:written.questions[0].id,answer:'tiny'}]));
});
test('new numerical variants have independently calculated answers',()=>{
  const builders={
    percentages:i=>(240+20*i)*(5+i%35)/100,
    'time-work':i=>(i+6)*(i+12)/(2*i+18),
    'compound-interest':i=>(1000+i*100)*.21,
    'work-wages':i=>(i+4)*150,
    'pipes-cisterns':i=>(i+5)*1.5,
    'trigonometry':i=>i+15,
    'line-graphs':i=>(30+i)*100/(100+10*i)
  };
  for(const [id,calculate] of Object.entries(builders))for(const i of [0,29,59]){
    const q=practiceTopic('aptitude',id).questions.find(q=>q.id===`quant-${id}-${i+1}`);
    assert(q,id);assert.equal(parseFloat(q.options[q.correctAnswer]),Number(calculate(i).toFixed(4)),q.id);
  }
});
test('DSA resources cover every question and divisor reference handles boundaries',()=>{
  for(const q of Object.values(dsaPracticeCatalog).flat()){
    const r=dsaResources[`${q.topic}:${q.id}`];assert(r?.videoUrl,q.id);
    assert.equal(new URL(r.videoUrl).hostname,'www.youtube.com');
    if(r.sourceUrl)assert(['leetcode.com','www.codechef.com'].includes(new URL(r.sourceUrl).hostname));
  }
  const solve=vm.runInNewContext(`${divisorEditorial.code.JavaScript}; smallestDivisor`);
  for(const a of [[1],[2,3,7],[8,4,12],[1,1,1]])for(let threshold=a.length;threshold<=a.reduce((x,y)=>x+y,0);threshold++){
    let expected=1;while(a.reduce((s,x)=>s+Math.ceil(x/expected),0)>threshold)expected++;
    assert.equal(solve(a,threshold),expected);
  }
});
test('library activity reaches the dashboard and roadmap without counting duplicate foundation questions twice',()=>{
  const state={problems:[],aptitude:[],cs:[],career:[],saved:[],practice:[{key:'aptitude:foundation:foundation-percentages-001',correct:true}],mistakes:[],library:[
    {domain:'aptitude',questionId:'foundation-percentages-001',correct:true,updatedAt:new Date('2026-10-07T10:00:00Z')},
    {domain:'aptitude',questionId:'quant-percentages-60',correct:true,updatedAt:new Date('2026-10-07T10:00:00Z')},
    {domain:'cs',questionId:'written-java-1',correct:null,updatedAt:new Date('2026-10-07T10:00:00Z')}
  ]};
  const metrics=progressMetrics(state,[],[],[],{},'2026-10-07','UTC');
  assert.equal(metrics.categories.find(c=>c.name==='Aptitude').completed,2);
  assert.equal(metrics.aptitudeAccuracy,100);assert.equal(metrics.streak,1);
  assert.equal(buildPersonalRoadmap({},state).achievements.aptitudeCorrect,2);
  assert.equal(buildPersonalRoadmap({},state).achievements.conceptsLearned,0);
});
