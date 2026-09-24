import { Router } from 'express';
import mongoose from 'mongoose';
import { CareerRecord } from '../models/CareerRecord.js';
import { CopilotConversation } from '../models/CopilotConversation.js';
import { buildCopilotReply, CopilotProviderError, copilotProviderStatus } from '../services/copilotService.js';
import { getCopilotContext } from '../services/copilotContext.js';
import { detectCopilotIntent } from '../services/copilotIntent.js';
import { recordSkillEvidence, scheduleRevision } from '../services/skillGraphService.js';

const router = Router();
const maxStoredMessages = 16;
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const clientMessage = message => ({
  id: String(message._id), role: message.role, content: message.content, focus: message.focus || '', intent: message.intent || '',
  sections: (message.sections || []).map(item => ({ title: item.title, content: item.content || '', bullets: item.bullets || [], code: item.code || '', language: item.language || '' })),
  actions: (message.actions || []).map(item => ({ label: item.label, route: item.route })), createdAt: message.createdAt
});
const clientConversation = (conversation, includeMessages = false) => ({
  id: String(conversation._id), title: conversation.title, createdAt: conversation.createdAt, updatedAt: conversation.updatedAt,
  ...(includeMessages ? { messages: (conversation.messages || []).map(clientMessage) } : { messageCount: conversation.messages?.length || 0 })
});
const parseAttachments = raw => Array.isArray(raw) ? raw.slice(0, 3).map(item => ({
  name: clean(item?.name).slice(0, 120) || 'Attachment', text: typeof item?.text === 'string' ? item.text.slice(0, 8000) : ''
})).filter(item => item.text) : [];
const titleFor = message => clean(message).slice(0, 80) || 'New conversation';
async function ownedConversation(userId, id) { return mongoose.isValidObjectId(id) ? CopilotConversation.findOne({ _id: id, userId }) : null; }

async function handleChat(req, res, next) {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    const attachments = parseAttachments(req.body?.attachments);
    if (!message && !attachments.length) return res.status(400).json({ success: false, error: 'Empty request', message: 'Write a question or attach a supported text file.' });
    if (message.length > 6000) return res.status(400).json({ success: false, error: 'Message too long', message: 'Keep your message under 6,000 characters.' });

    let conversation = req.body?.conversationId ? await ownedConversation(req.user.id, req.body.conversationId) : null;
    if (req.body?.conversationId && !conversation) return res.status(404).json({ success: false, error: 'Conversation not found', message: 'This conversation does not exist in your account.' });
    if (!conversation) conversation = new CopilotConversation({ userId: req.user.id, title: titleFor(message || attachments[0]?.name) });
    const history = conversation.messages.slice(-12).map(item => ({ role: item.role, content: item.content, intent: item.intent, focus: item.focus }));
    const intent = detectCopilotIntent({ message, history });
    const context = await getCopilotContext({ userId: req.user.id, profile: req.user.profile || {}, intent });
    let coachReply;
    try { coachReply = await buildCopilotReply({ message, intent, context, history, profile: req.user.profile || {}, attachments }); }
    catch (error) {
      if (error instanceof CopilotProviderError) return res.status(503).json({ success: false, error: 'Copilot temporarily unavailable', message: 'CareerForge Copilot is temporarily unavailable. Please retry.', code: 'COPILOT_UNAVAILABLE', retryable: true });
      throw error;
    }
    const userContent = message || `Please review: ${attachments.map(item => item.name).join(', ')}`;
    conversation.messages.push({ role: 'user', content: userContent });
    conversation.messages.push({ role: 'assistant', content: coachReply.message, focus: coachReply.focus, intent: coachReply.intent || intent, sections: coachReply.sections, actions: coachReply.actions });
    conversation.messages = conversation.messages.slice(-maxStoredMessages);
    if (conversation.messages.filter(item => item.role === 'user').length === 1) conversation.title = titleFor(userContent);
    await conversation.save();
    res.status(201).json({ success: true, data: { reply: { ...coachReply, context: null }, conversation: clientConversation(conversation, true), provider: copilotProviderStatus() }, message: 'CareerForge Copilot response generated successfully.' });
  } catch (error) { next(error); }
}

router.get('/status', (_, res) => res.json({ success: true, data: { provider: copilotProviderStatus() }, message: 'Copilot status retrieved successfully.' }));
router.get('/conversations', async (req, res, next) => {
  try {
    const conversations = await CopilotConversation.find({ userId: req.user.id }).sort({ updatedAt: -1 }).limit(20).select('title messages createdAt updatedAt').lean();
    res.json({ success: true, data: { conversations: conversations.map(item => clientConversation(item)) }, message: 'Recent Copilot chats retrieved successfully.' });
  } catch (error) { next(error); }
});
router.post('/conversations', async (req, res, next) => {
  try {
    const conversation = await CopilotConversation.create({ userId: req.user.id, title: clean(req.body?.title).slice(0, 120) || 'New conversation' });
    res.status(201).json({ success: true, data: { conversation: clientConversation(conversation, true) }, message: 'New Copilot chat created.' });
  } catch (error) { next(error); }
});
router.get('/conversations/:conversationId', async (req, res, next) => {
  try {
    const conversation = await ownedConversation(req.user.id, req.params.conversationId);
    if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found', message: 'This conversation does not exist in your account.' });
    res.json({ success: true, data: { conversation: clientConversation(conversation, true) }, message: 'Copilot conversation retrieved successfully.' });
  } catch (error) { next(error); }
});
router.delete('/conversations/:conversationId', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.conversationId)) return res.status(404).json({ success: false, error: 'Conversation not found', message: 'This conversation does not exist in your account.' });
    const conversation = await CopilotConversation.findOneAndDelete({ _id: req.params.conversationId, userId: req.user.id });
    if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found', message: 'This conversation does not exist in your account.' });
    res.json({ success: true, data: { id: String(conversation._id) }, message: 'Copilot conversation deleted.' });
  } catch (error) { next(error); }
});
router.post(['/chat', '/coach'], handleChat);

router.post('/resume-analysis', (req, res) => res.json({ success: true, data: { score: 0, suggestions: ['Add a resume to receive an analysis.'] }, message: 'Resume analysis is ready.' }));
router.post('/job-match', (req, res) => res.json({ success: true, data: { match: 0, missingSkills: [], recommendation: 'Add a job description to receive a match.' }, message: 'Job match is ready.' }));

const interviewQuestions = {
  Technical: 'Explain a technical trade-off you made in a project and why you chose it.', HR: 'Tell me about a time you received difficult feedback and what you changed.', DSA: 'How would you explain the time and space complexity of a two-pointer solution?', Java: 'When would you choose an interface over an abstract class in Java?', SQL: 'How would you investigate a query that became slow after a table grew?', Project: 'Tell me about a project you are proud of and the outcome it created.', Resume: 'Choose one skill from your resume and describe a situation where you used it to make a decision.'
};
const skillsFrom = value => String(value || '').split(',').map(item => item.trim()).filter(Boolean).slice(0, 6);
const contextualInterviewQuestion = ({ type, resume, project }) => {
  if (type === 'Project' && project?.data) {
    const projectName = clean(project.data.title) || 'this project'; const technologies = clean(project.data.stack); const result = clean(project.data.outcome || project.data.description);
    return `In ${projectName}${technologies ? `, you list ${technologies}` : ''}. Walk me through one design decision you made${result ? ` and how it affected ${result}` : ''}.`;
  }
  if (type === 'Resume') { const listedSkills = skillsFrom(resume?.data?.skills); if (listedSkills.length) return `Your resume lists ${listedSkills.slice(0, 3).join(', ')}. Choose one and describe a concrete decision where you used it, including the trade-off you considered.`; }
  return interviewQuestions[type];
};
const followUpFor = (type, answer) => {
  const lower = answer.toLowerCase();
  if (!/\d|%|ms|second|minute|user|result|impact|improv|reduc|increas/.test(lower)) return 'How would you measure whether that decision or action was successful?';
  if (!/trade.?off|because|instead|alternative|option/.test(lower)) return 'What alternative did you consider, and why did you choose your approach over it?';
  return type === 'Project' || type === 'Resume' ? 'If usage increased tenfold tomorrow, what would you change first and how would you validate it?' : 'What would you improve if you had one more iteration?';
};
const interviewFeedback = answer => {
  const words = answer.trim().split(/\s+/).filter(Boolean); const points = [];
  points.push(words.length < 35 ? 'Add context, your specific action, and the result so the answer is easier to assess.' : 'The answer has enough detail to discuss in a real interview.');
  points.push(!/\b(I|my|me)\b/i.test(answer) ? 'Make your own contribution explicit with “I”.' : 'You clearly identify your contribution.');
  points.push(!/\d|%|improv|reduc|increas|result|impact/i.test(answer) ? 'Close with a measurable result or concrete impact where possible.' : 'You connect the response to an outcome or impact.');
  return points;
};
router.post('/interview', async (req, res, next) => {
  try {
    const type = Object.hasOwn(interviewQuestions, req.body.type) ? req.body.type : 'Project'; const answer = typeof req.body.answer === 'string' ? req.body.answer.trim() : '';
    const [resume, project] = await Promise.all([type === 'Resume' ? CareerRecord.findOne({ userId: req.user.id, type: 'resume' }).sort({ updatedAt: -1 }).lean() : null, type === 'Project' ? CareerRecord.findOne({ userId: req.user.id, type: 'project' }).sort({ updatedAt: -1 }).lean() : null]);
    const suppliedQuestion = typeof req.body.question === 'string' ? clean(req.body.question).slice(0, 700) : ''; const prompt = suppliedQuestion || contextualInterviewQuestion({ type, resume, project });
    if (!answer) return res.json({ success: true, data: { type, question: prompt, feedback: null, session: null, nextQuestion: null, contextual: Boolean((type === 'Project' && project) || (type === 'Resume' && resume)) }, message: 'Interview question ready.' });
    if (answer.length < 20 || answer.length > 6000) return res.status(400).json({ success: false, error: 'Invalid answer', message: 'Provide an answer between 20 and 6,000 characters.' });
    const feedback = interviewFeedback(answer); const nextQuestion = followUpFor(type, answer);
    const session = await CareerRecord.create({ userId: req.user.id, type: 'interview', data: { type, question: prompt, answer, feedback, nextQuestion, contextual: Boolean((type === 'Project' && project) || (type === 'Resume' && resume)), submittedAt: new Date().toISOString() } });
    const label = type === 'HR' ? 'HR communication' : type === 'Technical' ? 'Technical communication' : `${type} interview`; const skillId = `interview:${type.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    await recordSkillEvidence({ userId: req.user.id, skillId, label, domain: 'interview', interviewResponses: 1 });
    await scheduleRevision({ userId: req.user.id, skillId, label, domain: 'interview', sourceType: 'interview_answer', sourceId: String(session._id), prompt: `Rehearse this answer again: ${prompt}`, dueInDays: 7 });
    res.status(201).json({ success: true, data: { type, question: prompt, feedback, session, nextQuestion, contextual: Boolean((type === 'Project' && project) || (type === 'Resume' && resume)) }, message: 'Interview response saved with structured feedback.' });
  } catch (error) { next(error); }
});
export default router;
