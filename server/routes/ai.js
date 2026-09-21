import { Router } from 'express';
import { ProblemProgress } from '../models/ProblemProgress.js';
import { CareerRecord } from '../models/CareerRecord.js';
import { buildCoachReply } from '../services/coachService.js';
import { recordSkillEvidence, scheduleRevision } from '../services/skillGraphService.js';

const router = Router();
router.post('/coach', async (req, res, next) => {
  try {
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    const attachments = Array.isArray(req.body.attachments) ? req.body.attachments.slice(0, 3).map(item => ({
      name: typeof item?.name === 'string' ? item.name.slice(0, 120) : 'Attachment',
      text: typeof item?.text === 'string' ? item.text.slice(0, 8000) : ''
    })) : [];
    if (!message && !attachments.some(item => item.text)) return res.status(400).json({ success: false, error: 'Empty request', message: 'Write a question or attach a supported text file.' });
    if (message.length > 6000) return res.status(400).json({ success: false, error: 'Message too long', message: 'Keep your message under 6,000 characters.' });
    const solved = await ProblemProgress.countDocuments({ userId: req.user.id, status: 'solved' });
    const reply = buildCoachReply({ message, attachments, profile: req.user.profile, stats: { solved } });
    res.json({ success: true, data: reply, message: 'Career coach response generated successfully.' });
  } catch (error) { next(error); }
});
router.post('/resume-analysis', (req, res) => res.json({ success: true, data: { score: 0, suggestions: ['Add a resume to receive an analysis.'] }, message: 'Resume analysis is ready.' }));
router.post('/job-match', (req, res) => res.json({ success: true, data: { match: 0, missingSkills: [], recommendation: 'Add a job description to receive a match.' }, message: 'Job match is ready.' }));
const interviewQuestions = {
  Technical: 'Explain a technical trade-off you made in a project and why you chose it.',
  HR: 'Tell me about a time you received difficult feedback and what you changed.',
  DSA: 'How would you explain the time and space complexity of a two-pointer solution?',
  Java: 'When would you choose an interface over an abstract class in Java?',
  SQL: 'How would you investigate a query that became slow after a table grew?',
  Project: 'Tell me about a project you are proud of and the outcome it created.',
  Resume: 'Choose one skill from your resume and describe a situation where you used it to make a decision.'
};
const trimmed = value => String(value || '').replace(/\s+/g, ' ').trim();
const skillsFrom = value => String(value || '').split(',').map(item => item.trim()).filter(Boolean).slice(0, 6);
const contextualInterviewQuestion = ({ type, resume, project }) => {
  if (type === 'Project' && project?.data) {
    const { title, stack, outcome, description } = project.data;
    const projectName = trimmed(title) || 'this project';
    const technologies = trimmed(stack);
    const result = trimmed(outcome || description);
    return `In ${projectName}${technologies ? `, you list ${technologies}` : ''}. Walk me through one design decision you made${result ? ` and how it affected ${result}` : ''}.`;
  }
  if (type === 'Resume') {
    const listedSkills = skillsFrom(resume?.data?.skills);
    if (listedSkills.length) return `Your resume lists ${listedSkills.slice(0, 3).join(', ')}. Choose one and describe a concrete decision where you used it, including the trade-off you considered.`;
  }
  return interviewQuestions[type];
};
const followUpFor = (type, answer) => {
  const lower = answer.toLowerCase();
  if (!/\d|%|ms|second|minute|user|result|impact|improv|reduc|increas/.test(lower)) return 'How would you measure whether that decision or action was successful?';
  if (!/trade.?off|because|instead|alternative|option/.test(lower)) return 'What alternative did you consider, and why did you choose your approach over it?';
  if (type === 'Project' || type === 'Resume') return 'If usage increased tenfold tomorrow, what would you change first and how would you validate it?';
  return 'What would you improve if you had one more iteration?';
};
const interviewFeedback = answer => {
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const points = [];
  if (words.length < 35) points.push('Add context, your specific action, and the result so the answer is easier to assess.');
  else points.push('The answer has enough detail to discuss in a real interview.');
  if (!/\b(I|my|me)\b/i.test(answer)) points.push('Make your own contribution explicit with “I”.');
  else points.push('You clearly identify your contribution.');
  if (!/\d|%|improv|reduc|increas|result|impact/i.test(answer)) points.push('Close with a measurable result or concrete impact where possible.');
  else points.push('You connect the response to an outcome or impact.');
  return points;
};
router.post('/interview', async (req, res, next) => {
  try {
    const type = Object.hasOwn(interviewQuestions, req.body.type) ? req.body.type : 'Project';
    const answer = typeof req.body.answer === 'string' ? req.body.answer.trim() : '';
    const [resume, project] = await Promise.all([
      type === 'Resume' ? CareerRecord.findOne({ userId: req.user.id, type: 'resume' }).sort({ updatedAt: -1 }).lean() : null,
      type === 'Project' ? CareerRecord.findOne({ userId: req.user.id, type: 'project' }).sort({ updatedAt: -1 }).lean() : null
    ]);
    const suppliedQuestion = typeof req.body.question === 'string' ? trimmed(req.body.question).slice(0, 700) : '';
    const prompt = suppliedQuestion || contextualInterviewQuestion({ type, resume, project });
    if (!answer) return res.json({ success: true, data: { type, question: prompt, feedback: null, session: null, nextQuestion: null, contextual: Boolean((type === 'Project' && project) || (type === 'Resume' && resume)) }, message: 'Interview question ready.' });
    if (answer.length < 20 || answer.length > 6000) return res.status(400).json({ success: false, error: 'Invalid answer', message: 'Provide an answer between 20 and 6,000 characters.' });
    const feedback = interviewFeedback(answer);
    const nextQuestion = followUpFor(type, answer);
    const session = await CareerRecord.create({ userId: req.user.id, type: 'interview', data: { type, question: prompt, answer, feedback, nextQuestion, contextual: Boolean((type === 'Project' && project) || (type === 'Resume' && resume)), submittedAt: new Date().toISOString() } });
    const label = type === 'HR' ? 'HR communication' : type === 'Technical' ? 'Technical communication' : `${type} interview`;
    const skillId = `interview:${type.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    await recordSkillEvidence({ userId: req.user.id, skillId, label, domain: 'interview', interviewResponses: 1 });
    await scheduleRevision({ userId: req.user.id, skillId, label, domain: 'interview', sourceType: 'interview_answer', sourceId: String(session._id), prompt: `Rehearse this answer again: ${prompt}`, dueInDays: 7 });
    res.status(201).json({ success: true, data: { type, question: prompt, feedback, session, nextQuestion, contextual: Boolean((type === 'Project' && project) || (type === 'Resume' && resume)) }, message: 'Interview response saved with structured feedback.' });
  } catch (error) { next(error); }
});
export default router;
