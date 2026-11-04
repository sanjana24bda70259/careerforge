import { Link } from 'react-router-dom';
import '../homeFeatures.css';
import { LearningPathIcon } from './LearningPathIcon.jsx';

const features = [
  ['dashboard', 'Personalized dashboard', 'See your preparation progress, suggested roadmap, daily plan and weekly targets in one place.', '/dashboard'],
  ['code', 'DSA practice & learning maps', 'Explore topic-wise questions, pattern maps, theory, animated walkthroughs and saved solution drafts.', '/dsa'],
  ['book', 'Aptitude & reasoning', 'Practise quantitative, logical, verbal and data interpretation questions with answer reviews.', '/aptitude'],
  ['book', 'Computer science foundations', 'Study programming, databases, operating systems and networks with notes, quizzes and guided exercises.', '/cs'],
  ['clock', 'Study calendar & focus timer', 'Plan study sessions, schedule your daily tasks and track the time you actually spend studying.', '/calendar'],
  ['chart', 'Progress & weekly reviews', 'Review activity, topic progress and preparation trends. Reflect on your week and plan your next step.', '/progress'],
  ['check', 'Mock tests', 'Practise timed assessments and review your answers to find the topics that need more attention.', '/mock-tests'],
  ['chat', 'Interview preparation', 'Prepare technical and HR answers, group discussions and placement-style exercises at your pace.', '/interviews'],
  ['book', 'Notes, lists & goals', 'Keep study notes, build checklists and set deadlines for exams, interviews and personal milestones.', '/notes'],
  ['repeat', 'Revision & mistake notebook', 'Revisit selected questions, record mistakes and use your review queue to strengthen difficult concepts.', '/revisions'],
  ['bookmark', 'Bookmarks & cheatsheets', 'Save questions and learning material, then return to concise pattern notes and reference templates.', '/bookmarks'],
  ['chat', 'AI study help', 'Ask preparation questions and get help thinking through concepts, approaches and your next study step.', '/help'],
  ['briefcase', 'Application tracker', 'Organize the opportunities you add, keep application details together and follow your progress.', '/jobs'],
  ['file', 'Resume workspace', 'Work on your resume content and explain your skills, experience and project outcomes clearly.', '/resume'],
  ['code', 'Project workspace', 'Organize your project ideas and progress, and build a stronger story around what you create.', '/projects'],
  ['bell', 'Reminders & preferences', 'Check study notifications and manage your profile, preparation goals and appearance settings.', '/notifications']
];
const faqs = [
  ['What can I do with CareerForge?', 'CareerForge brings DSA, aptitude, CS fundamentals, interview preparation and career planning into one workspace. You can practise, save notes, plan study sessions and review your progress.'],
  ['Is CareerForge suitable for beginners?', 'Yes. Start with the foundation topics and use the learning maps, concept explanations and step-by-step visualizations. Set your goals and available study time to get a suggested starting path.'],
  ['Can I prepare for coding and placement interviews?', 'Yes. Combine DSA practice with aptitude, core CS, mock tests and interview exercises. Use the resume, project and application workspaces to organize the career side of your preparation.'],
  ['Can I run and submit code here?', 'You can write and save solution drafts. In-app Run and Submit require a connected isolated execution provider and remain disabled when one is unavailable. Source-platform links are provided where available.'],
  ['How is my progress recorded?', 'Saved practice checkmarks are self-reported and are kept separate from accepted solutions. Reading theory or watching an animation does not automatically complete a question. Written practice uses self-review rather than an invented automatic score.'],
  ['Will my notes and practice be saved?', 'Sign in to keep supported practice progress, bookmarks, notes and study plans linked to your account. Solution editor drafts are also stored locally per language, so use the same browser to return to those drafts.'],
  ['How do I plan my day and review mistakes?', 'Use the study calendar to add sessions or schedule your daily plan. The focus timer tracks study time, while Revision and the Mistake Notebook help you revisit material you chose to review.'],
  ['Can I switch between light and night mode?', 'Yes. Use the Theme control in the workspace or your appearance settings. Night mode uses black surfaces and Light mode uses white surfaces, with sage-green accents.']
];
function FeatureIcon({ name }) {
 const paths = { dashboard:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',code:'m8 6-6 6 6 6 M16 6l6 6-6 6 M14 3l-4 18',book:'M3 4h6l3 2 3-2h6v15h-6l-3 2-3-2H3z M12 6v15',clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2',chart:'M4 20V10 M12 20V4 M20 20v-7',check:'M5 3h14v18H5z M8 9l2 2 5-5 M8 16h8',chat:'M3 4h18v13H9l-6 4z M7 9h10 M7 13h6',repeat:'M4 10a8 8 0 0 1 14-5l2 2 M20 3v4h-4 M20 14a8 8 0 0 1-14 5l-2-2 M4 21v-4h4',bookmark:'M6 3h12v18l-6-4-6 4z',briefcase:'M3 7h18v14H3z M8 7V3h8v4 M3 12l9 3 9-3 M12 12v5',file:'M5 3h9l5 5v13H5z M14 3v6h5 M8 13h8 M8 17h6',bell:'M5 17h14l-2-4V8a5 5 0 0 0-10 0v5z M10 21h4'};
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
export function HomeFeatures() {
 return <section className="home-width home-capabilities" id="features" aria-labelledby="features-title"><header className="home-centered-heading"><span className="home-eyebrow">YOUR COMPLETE PREPARATION SPACE</span><h2 id="features-title">Everything you need to <em>move forward.</em></h2><p>From your first practice question to your next interview, find the tools to make every study session count.</p></header><div className="home-capability-grid">{features.map(([icon,title,description,to]) => <Link className="home-capability" to={to} key={title}><div><span className="home-capability-icon">{to === '/dsa' ? <LearningPathIcon type="dsa" /> : to === '/aptitude' ? <LearningPathIcon type="aptitude" /> : to === '/cs' ? <LearningPathIcon type="cs" /> : to === '/interviews' ? <LearningPathIcon type="interviews" /> : <FeatureIcon name={icon} />}</span><h3>{title}</h3><span className="home-capability-arrow" aria-hidden="true"></span></div><p>{description}</p></Link>)}</div><p className="home-capability-note">Choose a tool to continue. Sign in to access your personal workspace.</p></section>;
}
export function HomeFaq() {
 return <section className="home-width home-faq" id="faq" aria-labelledby="faq-title"><header className="home-centered-heading"><span className="home-eyebrow"></span><h2 id="faq-title">Frequently <em>asked questions.</em></h2><p>Quick answers to common questions about CareerForge.</p></header><div className="home-faq-list">{faqs.slice(0, 4).map(([question,answer],i) => <details key={question}><summary><span className="home-faq-number">Q{ i+1 }.</span><h3>{question}</h3><span className="home-faq-chevron" aria-hidden="true">⌄</span></summary><p>{answer}</p></details>)}</div><p className="home-faq-foot">Need more help? <Link to="/support">Visit help & troubleshooting </Link></p></section>;
}
