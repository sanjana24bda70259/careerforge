import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DsaStoryPlayer } from './DsaStoryPlayer.jsx';
import { AlgorithmPlayer } from './DsaVisualStudio.jsx';
import { explainerById } from '../../../shared/dsaExplainers.mjs';
import { visualLessonById } from '../../../shared/dsaVisualLessons.mjs';
import { dsaResources } from '../../../shared/dsaResources.mjs';
import { DsaTheoryArticle } from './DsaTheoryArticle.jsx';
import '../dsaProblemLearning.css';

export function DsaProblemLearning({problem,topicId,children}) {
  const [searchParams]=useSearchParams();
  const [tab,setTab]=useState(() => searchParams.get('view') === 'theory' ? 'theory' : 'problem');
  const lesson=explainerById(problem.visualizationId)||visualLessonById(problem.visualizationId);
  const resources=dsaResources[`${topicId}:${problem.id}`];
  const progress=problem.progress||{};
  const lastSubmission=progress.lastSubmission;
  const submittedAt=lastSubmission?.submittedAt?new Date(lastSubmission.submittedAt).toLocaleString():null;
  return <div className="dpl-learning">
    <nav className="dpl-tabs" aria-label="Problem learning sections">{[['problem','Problem','▣'],['theory','Solution','</>'],['submissions','Submissions','◷'],['animation','Walkthrough','▹'],['videos','Resources','▦']].map(([id,label,icon])=><button key={id} type="button" className={tab===id?'active':''} aria-selected={tab===id} onClick={()=>setTab(id)}><span aria-hidden="true">{icon}</span>{label}</button>)}</nav>
    {tab==='problem'&&children}
    {tab==='theory'&&<DsaTheoryArticle key={problem.id} problem={problem} topicId={topicId} lesson={lesson}/>}
    {tab==='submissions'&&<section className="dpl-submissions"><span className="overline">YOUR PROGRESS</span><h2>Submission history</h2><div className="dpl-submission-summary"><article><small>STATUS</small><b>{progress.status?.replace('_',' ')||'Not started'}</b></article><article><small>ATTEMPTS</small><b>{progress.attempts||0}</b></article><article><small>LANGUAGE</small><b>{lastSubmission?.language||progress.language||'—'}</b></article></div>{lastSubmission?<article className="dpl-last-submission"><div><span className={`dpl-submission-dot ${lastSubmission.status||'attempted'}`} /><div><b>{lastSubmission.status||'Attempt recorded'}</b><small>{submittedAt}{lastSubmission.executionTimeMs?` · ${lastSubmission.executionTimeMs} ms`:''}</small></div></div><span>{lastSubmission.language}</span></article>:<div className="dpl-empty-submissions"><b>No judged submissions yet</b><p>Your drafts save automatically. A judged result will appear here after a secure execution provider is connected and you submit code.</p></div>}</section>}
    {tab==='animation'&&<div className="dpl-animation dsa-studio">{lesson?.kind==='explainer'?<DsaStoryPlayer key={lesson.id} lesson={lesson}/>:lesson?<AlgorithmPlayer key={lesson.id} lesson={lesson}/>:<p>No walkthrough is available for this problem.</p>}</div>}
    {tab==='videos'&&<section className="dpl-resources"><span className="overline">KEEP LEARNING</span><h2>Video & problem references</h2>{resources?.videoUrl&&<a href={resources.videoUrl} target="_blank" rel="noreferrer"><span>▶</span><div><b>{resources.videoTitle}</b><small>NeetCode · {resources.videoScope==='problem'?'Problem walkthrough':'Related topic lesson'}</small></div><strong></strong></a>}{resources?.youtubeSearch&&<a href={resources.youtubeSearch} target="_blank" rel="noreferrer"><div><b>Find more explanations on YouTube</b><small>Search results for {problem.title}</small></div><strong></strong></a>}{resources?.sourceUrl?<a href={resources.sourceUrl} target="_blank" rel="noreferrer"><div><b>{resources.sourceLabel}</b><small>Open the source platform to practise and submit.</small></div><strong></strong></a>:<p>CareerForge exercise. No equivalent source problem has been linked.</p>}<p>CareerForge examples and animated explanations are authored for this library. External links open the named provider.</p></section>}
  </div>;
}
