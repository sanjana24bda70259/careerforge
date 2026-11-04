import { quantitativePractice } from './practiceQuantitative.js';
import { reasoningPractice } from './practiceReasoning.js';
import { csPractice, interviewPractice } from './practiceWritten.js';
import { aptitudeQuestions } from './aptitudeCatalog.js';

// Keep the authored foundation questions alongside the numerical exercise variants.
const quantitative = quantitativePractice.map(topic => {
  const oldId = ({ lcm:'lcm-hcf', hcf:'lcm-hcf', 'mensuration-2d':'mensuration', 'mensuration-3d':'mensuration' })[topic.id] || topic.id;
  const curated = (aptitudeQuestions[oldId] || []).map(q=>({...q,prompt:q.question}));
  const seen=new Set();
  const questions=[...curated,...topic.questions].filter(q=>{if(seen.has(q.prompt))return false;seen.add(q.prompt);return true;});
  return {...topic,format:'mcq',questions,practiceNote:'Includes worked numerical variations for repeated practice.'};
});
const placementQuestions = [
  ...quantitative.slice(0,20).map(t=>t.questions.find(q=>q.id.startsWith('quant-'))),
  ...reasoningPractice.filter(t=>['Logical Reasoning','Verbal Reasoning','Nonverbal Reasoning'].includes(t.category)).slice(0,10).flatMap(t=>t.questions.slice(0,2)),
  ...reasoningPractice.filter(t=>t.category==='Verbal Ability').flatMap(t=>t.questions.slice(5,10))
].map((q,i)=>({...q,id:`placement-mixed-${i+1}`}));
const interviewTopics=interviewPractice.map(t=>t.id==='placement-papers'?{...t,format:'mcq',theory:'An original mixed placement practice set: 20 quantitative, 20 reasoning and 20 verbal questions. Review the working after checking an answer. This is not an actual company paper.',questions:placementQuestions}:t);
export const practiceTopics = [...quantitative,...reasoningPractice,...csPractice,...interviewTopics];
export const practiceTopic = (domain,id) => practiceTopics.find(t=>t.domain===domain && t.id===id);
export const aptitudePracticeKey = questionId => questionId.startsWith('foundation-') ? `aptitude:foundation:${questionId}` : `aptitude:library:${questionId}`;
export const practiceSummary = domain => practiceTopics.filter(t=>t.domain===domain).map(({questions,...topic})=>({...topic,questionCount:questions.length}));
export function reviewPractice(topic, answers) {
  if(!Array.isArray(answers)||answers.length<1||answers.length>100) throw new Error('Submit between 1 and 100 answers.');
  const seen = new Set();
  return answers.map(answer=>{
    const question = topic.questions.find(q=>q.id===answer?.questionId);
    if(!question||seen.has(question.id)) throw new Error('Choose valid, distinct questions from this topic.');
    seen.add(question.id);
    if(topic.format==='written') {
      if(typeof answer.answer!=='string'||answer.answer.trim().length<20||answer.answer.length>10000) throw new Error('Write between 20 and 10,000 characters before saving.');
      return {questionId:question.id,answer:answer.answer.trim(),correct:null,explanation:question.explanation};
    }
    if(!Number.isInteger(answer.answer)||answer.answer<0||answer.answer>=question.options.length) throw new Error('Select one of the available options.');
    return {questionId:question.id,answer:answer.answer,correct:answer.answer===question.correctAnswer,correctAnswer:question.correctAnswer,explanation:question.explanation};
  });
}
