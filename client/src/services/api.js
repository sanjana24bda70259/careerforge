import { endSession, getToken } from './session.js';

const request = async (path, options = {}) => {
  const isPublicAuth = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'].includes(path);
  const token = isPublicAuth ? null : getToken();
  let response;
  try {
    response = await fetch(`/api${path}`, { ...options, headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  } catch {
    throw new Error('Cannot reach the API. Start the CareerForge server and check the API URL.');
  }

  if (response.status === 401 && !isPublicAuth) {
    endSession(token);
    throw new Error('Your session has expired. Please sign in again.');
  }
  const contentType = response.headers.get('content-type') || '';
  const body = await response.text();
  if (!contentType.includes('application/json')) {
    if (response.status >= 500) throw new Error('The CareerForge API is unavailable. Start the API server, then retry.');
    if (response.status === 429) throw new Error('Too many requests. Please wait a few minutes and try again.');
    const received = contentType || 'an empty response';
    throw new Error(`API request to ${path} failed (${response.status}). Expected JSON but received ${received}.`);
  }

  let payload;
  try {
    payload = body ? JSON.parse(body) : null;
  } catch {
    throw new Error(`API request to ${path} failed (${response.status}). The server returned invalid JSON.`);
  }
  if (!payload) throw new Error(`API request to ${path} failed (${response.status}). The server returned an empty JSON response.`);
  if (!response.ok || !payload.success) throw new Error(payload.message || payload.error || `API request failed with status ${response.status}.`);
  return payload.data;
};
export const api = {
  practiceLibrary: domain => request(`/practice-library/${encodeURIComponent(domain)}`),
  practiceTopic: (domain, topic) => request(`/practice-library/${encodeURIComponent(domain)}/${encodeURIComponent(topic)}`),
  reviewPractice: (domain, topic, answers) => request(`/practice-library/${encodeURIComponent(domain)}/${encodeURIComponent(topic)}/review`, { method: 'POST', body: JSON.stringify({ answers }) }),
  workspaceOverview: () => request('/workspace/overview'),
  workspacePreferences: body => request('/workspace/preferences', { method: 'PATCH', body: JSON.stringify(body) }),
  schedule: (from, to) => request(`/workspace/schedule?from=${from}&to=${to}`),
  createSchedule: body => request('/workspace/schedule', { method: 'POST', body: JSON.stringify(body) }),
  updateSchedule: (id, body) => request(`/workspace/schedule/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  schedulePlan: startTime => request('/workspace/schedule/import-plan', { method: 'POST', body: JSON.stringify({ startTime }) }),
  workspaceEntries: (type, archived = false) => request(`/workspace/entries?type=${type}&archived=${archived}`),
  createWorkspaceEntry: body => request('/workspace/entries', { method: 'POST', body: JSON.stringify(body) }),
  updateWorkspaceEntry: (id, body) => request(`/workspace/entries/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  startFocus: domain => request('/workspace/focus/start', { method: 'POST', body: JSON.stringify({ domain }) }),
  stopFocus: () => request('/workspace/focus/stop', { method: 'POST' }),
  readNotifications: keys => request('/workspace/notifications/read', { method: 'POST', body: JSON.stringify({ keys }) }),
  workspaceHealth: () => request('/workspace/health'),
  personalRoadmap: () => request('/dashboard/roadmap'),
  personalizedSuggestions: () => request('/dashboard/suggestions'),
  acknowledgeDay: () => request('/dashboard/today-plan/acknowledge', { method: 'POST' }),
  learningItems: (collection = '') => request(`/learning-items?collection=${encodeURIComponent(collection)}`),
  learningItem: key => request(`/learning-items/${encodeURIComponent(key)}`),
  saveLearningItem: (key, body) => request(`/learning-items/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify(body) }),
  saveLearningMistake: (key, body) => request(`/learning-items/${encodeURIComponent(key)}/mistake`, { method: 'POST', body: JSON.stringify(body) }),
  answerLearningItem: (key, answer) => request(`/learning-items/${encodeURIComponent(key)}/answer`, { method: 'POST', body: JSON.stringify({ answer }) }),
  revealLearningItem: key => request(`/learning-items/${encodeURIComponent(key)}/reveal`, { method: 'POST' }),
  reviewLearningItem: (key, recalled) => request(`/learning-items/${encodeURIComponent(key)}/review`, { method: 'POST', body: JSON.stringify({ recalled }) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (body) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
  resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  profile: (body) => request('/profile', { method: 'PUT', body: JSON.stringify(body) }),
  dashboard: () => request('/dashboard'),
  todayPlan: () => request('/dashboard/today-plan'),
  startTodayPlan: () => request('/dashboard/today-plan/start', { method: 'POST' }),
  updateTodayPlanTask: (taskId, status) => request(`/dashboard/today-plan/tasks/${encodeURIComponent(taskId)}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  rescheduleTodayPlanTask: (taskId, dateKey) => request(`/dashboard/today-plan/tasks/${encodeURIComponent(taskId)}/reschedule`, { method: 'POST', body: JSON.stringify({ dateKey }) }),
  replaceTodayPlanTask: (taskId) => request(`/dashboard/today-plan/tasks/${encodeURIComponent(taskId)}/replace`, { method: 'POST' }),
  roadmap: () => request('/dsa/roadmap'),
  dsaPractice: (topicId) => request(`/dsa/topics/${encodeURIComponent(topicId)}/questions`),
  dsaTopicResources: (topicId) => request(`/dsa/topics/${encodeURIComponent(topicId)}/resources`),
  dsaProblem: (topicId, questionId) => request(`/dsa/topics/${encodeURIComponent(topicId)}/questions/${encodeURIComponent(questionId)}`),
  runDsaCode: (topicId, questionId, body) => request(`/dsa/topics/${encodeURIComponent(topicId)}/questions/${encodeURIComponent(questionId)}/run`, { method: 'POST', body: JSON.stringify(body) }),
  submitDsaCode: (topicId, questionId, body) => request(`/dsa/topics/${encodeURIComponent(topicId)}/questions/${encodeURIComponent(questionId)}/submit`, { method: 'POST', body: JSON.stringify(body) }),
  dsaCheatsheets: () => request('/dsa/cheatsheets'),
  dsaBookmarks: () => request('/dsa/bookmarks'),
  bookmarkDsaCheatsheet: (cheatsheetId) => request(`/dsa/cheatsheets/${encodeURIComponent(cheatsheetId)}/bookmark`, { method: 'POST' }),
  removeDsaCheatsheetBookmark: (cheatsheetId) => request(`/dsa/cheatsheets/${encodeURIComponent(cheatsheetId)}/bookmark`, { method: 'DELETE' }),
  reviseDsaCheatsheet: (cheatsheetId) => request(`/dsa/cheatsheets/${encodeURIComponent(cheatsheetId)}/revised`, { method: 'POST' }),
  markDsaQuestionSolved: (topicId, questionId) => request(`/dsa/topics/${encodeURIComponent(topicId)}/questions/${encodeURIComponent(questionId)}/solve`, { method: 'POST' }),
  diagnosticQuestions: (topicId) => request(`/dsa/topics/${topicId}/diagnostic`),
  saveDiagnostic: (topicId, answers) => request(`/dsa/topics/${topicId}/diagnostic`, { method: 'POST', body: JSON.stringify({ answers }) }),
  problems: (params = {}) => {
    const search = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')).toString();
    return request(`/problems${search ? `?${search}` : ''}`);
  },
  saveAttempt: (problemId, status, usedHint = false, submission = {}) => request(`/problems/${problemId}/attempt`, { method: 'POST', body: JSON.stringify({ status, usedHint, ...submission }) }),
  dueRevisions: () => request('/revisions/due'),
  completeRevision: (revisionId, recalled = true) => request(`/revisions/${revisionId}/complete`, { method: 'POST', body: JSON.stringify({ recalled }) }),
  skillGraph: () => request('/skills/overview'),
  skillActions: () => request('/skills/next-actions'),
  dueSkillRevisions: () => request('/skills/revisions/due'),
  placementOverview: () => request('/placement/overview'),
  startPlacementSimulation: () => request('/placement/start', { method: 'POST' }),
  todayQuest: () => request('/quests/today'),
  addDailyTask: (title) => request('/quests/today/tasks', { method: 'POST', body: JSON.stringify({ title }) }),
  updateDailyTask: (dateKey, taskId, completed) => request(`/quests/${encodeURIComponent(dateKey)}/tasks/${encodeURIComponent(taskId)}`, { method: 'PATCH', body: JSON.stringify({ completed }) }),
  updateQuestTask: (taskId, completed) => request(`/quests/today/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify({ completed }) })
  ,records: (type) => request(`/career/${type}`)
  ,createRecord: (type, data) => request(`/career/${type}`, { method: 'POST', body: JSON.stringify({ data }) })
  ,updateRecord: (type, recordId, data) => request(`/career/${encodeURIComponent(type)}/${encodeURIComponent(recordId)}`, { method: 'PATCH', body: JSON.stringify({ data }) })
  ,deleteRecord: (type, recordId) => request(`/career/${encodeURIComponent(type)}/${encodeURIComponent(recordId)}`, { method: 'DELETE' })
  ,aptitude: () => request('/learning/aptitude')
  ,csFundamentals: () => request('/learning/cs')
  ,csSubject: (subjectId) => request(`/learning/cs/${encodeURIComponent(subjectId)}`)
  ,markCsTopicLearned: (subjectId, topicId) => request(`/learning/cs/${encodeURIComponent(subjectId)}/topics/${encodeURIComponent(topicId)}/learn`, { method: 'POST' })
  ,markCsTopicRevised: (subjectId, topicId) => request(`/learning/cs/${encodeURIComponent(subjectId)}/topics/${encodeURIComponent(topicId)}/revised`, { method: 'POST' })
  ,submitCsQuiz: (subjectId, topicId, answers) => request(`/learning/cs/${encodeURIComponent(subjectId)}/topics/${encodeURIComponent(topicId)}/quiz`, { method: 'POST', body: JSON.stringify({ answers }) })
  ,mistakes: (source = '') => request(`/mistakes${source ? `?source=${encodeURIComponent(source)}` : ''}`)
  ,createMistake: (body) => request('/mistakes', { method: 'POST', body: JSON.stringify(body) })
  ,updateMistake: (mistakeId, body) => request(`/mistakes/${encodeURIComponent(mistakeId)}`, { method: 'PATCH', body: JSON.stringify(body) })
  ,deleteMistake: (mistakeId) => request(`/mistakes/${encodeURIComponent(mistakeId)}`, { method: 'DELETE' })
  ,aptitudeQuestions: (topic) => request(`/learning/aptitude/${encodeURIComponent(topic)}/questions`)
  ,saveAptitudeAttempt: (body) => request('/learning/aptitude/attempt', { method: 'POST', body: JSON.stringify(body) })
  ,aptitudeAttempt: (attemptId) => request(`/learning/aptitude/attempts/${encodeURIComponent(attemptId)}`)
  ,advancedAptitude: () => request('/learning/aptitude/advanced')
  ,advancedAptitudeQuestions: (topic, mode = 'practice') => request(`/learning/aptitude/advanced/${encodeURIComponent(topic)}/questions?mode=${encodeURIComponent(mode)}`)
  ,advancedDailyChallenge: () => request('/learning/aptitude/advanced/daily')
  ,advancedMocks: () => request('/learning/aptitude/advanced/mocks')
  ,advancedMock: (mockId) => request(`/learning/aptitude/advanced/mocks/${encodeURIComponent(mockId)}`)
  ,advancedMistakes: () => request('/learning/aptitude/advanced/mistakes')
  ,advancedSavedQuestions: () => request('/learning/aptitude/advanced/saved-questions')
  ,saveAdvancedQuestion: (questionId) => request(`/learning/aptitude/advanced/questions/${encodeURIComponent(questionId)}/bookmark`, { method: 'POST' })
  ,removeAdvancedQuestion: (questionId) => request(`/learning/aptitude/advanced/questions/${encodeURIComponent(questionId)}/bookmark`, { method: 'DELETE' })
  ,formulas: () => request('/learning/aptitude/formulas')
  ,saveFormula: (formulaId) => request(`/learning/aptitude/formulas/${encodeURIComponent(formulaId)}/bookmark`, { method: 'POST' })
  ,removeFormula: (formulaId) => request(`/learning/aptitude/formulas/${encodeURIComponent(formulaId)}/bookmark`, { method: 'DELETE' })
  ,csTopics: () => request('/learning/cs')
  ,companies: () => request('/learning/companies')
  ,backlogs: () => request('/backlogs')
  ,copilotStatus: () => request('/copilot/status')
  ,copilotConversations: () => request('/copilot/conversations')
  ,createCopilotConversation: (title) => request('/copilot/conversations', { method: 'POST', body: JSON.stringify({ title }) })
  ,copilotConversation: (conversationId) => request(`/copilot/conversations/${encodeURIComponent(conversationId)}`)
  ,deleteCopilotConversation: (conversationId) => request(`/copilot/conversations/${encodeURIComponent(conversationId)}`, { method: 'DELETE' })
  ,copilotChat: (payload) => request('/copilot/chat', { method: 'POST', body: JSON.stringify(typeof payload === 'string' ? { message: payload } : payload) })
  ,coach: (payload) => request('/copilot/chat', { method: 'POST', body: JSON.stringify(typeof payload === 'string' ? { message: payload } : payload) })
  ,interview: (body) => request('/ai/interview', { method: 'POST', body: JSON.stringify(body) })
};
