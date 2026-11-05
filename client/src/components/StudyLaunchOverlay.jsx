import '../studyLaunch.css';

export function StudyLaunchOverlay() {
  return <div className="study-launch" aria-hidden="true"><div className="study-notebook" data-study-board><header><span>cf</span><div><small>CAREERFORGE STUDY PLAN</small><b>Today’s focused path</b></div><i>01</i></header><ol><li data-study-step><span>01</span><b>Learn the concept</b><small>DSA · 25 min</small></li><li data-study-step><span>02</span><b>Practise with intent</b><small>Problem solving · 40 min</small></li><li data-study-step><span>03</span><b>Review and grow</b><small>Reflect · 10 min</small></li></ol><footer><span>YOUR NEXT CHAPTER</span><i /></footer></div><div className="study-note note-code" data-study-note><b>&lt;/&gt;</b><span>DSA</span></div><div className="study-note note-focus" data-study-note><b>◌</b><span>FOCUS</span></div><div className="study-note note-goal" data-study-note><b>↗</b><span>GOALS</span></div></div>;
}
