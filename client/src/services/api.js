const request = async (path, options = {}) => {
  const token = localStorage.getItem('careerforge_token');
  let response;
  try {
    response = await fetch(`/api${path}`, { ...options, headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  } catch {
    throw new Error('Cannot reach the API. Start the CareerForge server and check the API URL.');
  }

  const contentType = response.headers.get('content-type') || '';
  const body = await response.text();
  if (!contentType.includes('application/json')) {
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
  if (response.status === 401) {
    localStorage.removeItem('careerforge_token');
    localStorage.removeItem('careerforge_user');
  }
  if (!response.ok || !payload.success) throw new Error(payload.message || payload.error || `API request failed with status ${response.status}.`);
  return payload.data;
};
export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  profile: (body) => request('/profile', { method: 'PUT', body: JSON.stringify(body) }),
  dashboard: () => request('/dashboard'),
  roadmap: () => request('/dsa/roadmap'),
  dsaPractice: (topicId) => request(`/dsa/topics/${encodeURIComponent(topicId)}/questions`),
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
  updateQuestTask: (taskId, completed) => request(`/quests/today/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify({ completed }) })
  ,records: (type) => request(`/career/${type}`)
  ,createRecord: (type, data) => request(`/career/${type}`, { method: 'POST', body: JSON.stringify({ data }) })
  ,updateRecord: (type, recordId, data) => request(`/career/${encodeURIComponent(type)}/${encodeURIComponent(recordId)}`, { method: 'PATCH', body: JSON.stringify({ data }) })
  ,deleteRecord: (type, recordId) => request(`/career/${encodeURIComponent(type)}/${encodeURIComponent(recordId)}`, { method: 'DELETE' })
  ,aptitude: () => request('/learning/aptitude')
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
  ,coach: (payload) => request('/ai/coach', { method: 'POST', body: JSON.stringify(typeof payload === 'string' ? { message: payload } : payload) })
  ,interview: (body) => request('/ai/interview', { method: 'POST', body: JSON.stringify(body) })
};
