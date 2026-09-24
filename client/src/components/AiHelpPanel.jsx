import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { WorkspaceLayout } from './Workspace.jsx';
import '../aiHelp.css';
import '../copilot.css';

const quickPrompts = [
  ['Today’s plan', 'What should I study today?'], ['Data Analyst roadmap', 'roadmap for data analyst'],
  ['DSA help', 'Teach me binary search'], ['Resume help', 'Help improve my resume']
];
const textExtensions = new Set(['txt', 'md', 'csv', 'json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'java', 'py', 'sql']);
const readableFile = file => file.type.startsWith('text/') || textExtensions.has(file.name.split('.').at(-1)?.toLowerCase());
const bytes = value => value < 1024 ? `${value} B` : `${(value / 1024).toFixed(1)} KB`;
const turnFromMessage = item => item.role === 'user'
  ? { id: item.id, role: 'user', text: item.content, createdAt: item.createdAt }
  : { id: item.id, role: 'coach', answer: item.content, focus: item.focus, intent: item.intent, sections: item.sections || [], actions: item.actions || [], createdAt: item.createdAt };
const toTurns = messages => (messages || []).map(turnFromMessage);

export function AiHelpPanel({ user }) {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [recentChats, setRecentChats] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [progress, setProgress] = useState(null);
  const [provider, setProvider] = useState(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const conversationEndRef = useRef(null);
  const speechSupported = useMemo(() => typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition), []);
  const firstName = user?.profile?.name?.trim().split(/\s+/)[0] || 'there';
  const stats = progress?.stats;

  const refreshRecentChats = async () => {
    const data = await api.copilotConversations();
    setRecentChats(data.conversations || []);
    return data.conversations || [];
  };
  useEffect(() => {
    let active = true;
    void Promise.allSettled([api.dashboard(), api.copilotStatus(), api.copilotConversations()]).then(results => {
      if (!active) return;
      const [dashboard, status, chats] = results;
      setProgress(dashboard.status === 'fulfilled' ? dashboard.value : { stats: null });
      if (status.status === 'fulfilled') setProvider(status.value.provider);
      if (chats.status === 'fulfilled') setRecentChats(chats.value.conversations || []);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => () => recognitionRef.current?.stop?.(), []);
  useEffect(() => { conversationEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, [conversation, sending]);

  const appendTranscript = text => {
    const cleaned = text.trim();
    if (!cleaned) return;
    setMessage(current => `${current}${current && !current.endsWith(' ') ? ' ' : ''}${cleaned}`.trimStart());
    setVoiceTranscript(current => `${current}${current && !current.endsWith(' ') ? ' ' : ''}${cleaned}`.trimStart());
  };
  const stopVoice = () => recognitionRef.current?.stop?.();
  const startVoice = () => {
    if (!speechSupported) return;
    setError(''); setVoiceStatus('Listening… your transcript will appear in the message box.'); setVoiceTranscript('');
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.continuous = true; recognition.interimResults = false; recognition.lang = navigator.language || 'en-US';
    recognition.onstart = () => setRecording(true);
    recognition.onresult = event => {
      let transcript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) if (event.results[index].isFinal) transcript += event.results[index][0].transcript;
      appendTranscript(transcript);
    };
    recognition.onerror = event => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') setError('Microphone access was not granted. Allow it in your browser, then try again.');
      else if (event.error !== 'aborted' && event.error !== 'no-speech') setError('Voice transcription was unavailable. You can type your question instead.');
    };
    recognition.onend = () => { setRecording(false); setVoiceStatus(current => current ? 'Transcript ready to review and edit before sending.' : ''); };
    try { recognition.start(); } catch { setError('Voice transcription is already starting. Please wait a moment.'); }
  };
  const addFiles = async event => {
    const files = Array.from(event.target.files || []); event.target.value = ''; setError('');
    const next = await Promise.all(files.map(async file => {
      if (file.size > 200 * 1024) return { id: `${file.name}-${file.lastModified}`, name: file.name, size: file.size, unsupported: true, note: 'Files above 200 KB are not read.' };
      if (!readableFile(file)) return { id: `${file.name}-${file.lastModified}`, name: file.name, size: file.size, unsupported: true, note: 'Choose a text, code, CSV, Markdown, or JSON file.' };
      return { id: `${file.name}-${file.lastModified}`, name: file.name, size: file.size, text: (await file.text()).slice(0, 8000) };
    }));
    setAttachments(current => [...current, ...next].slice(0, 3));
  };
  const openConversation = async id => {
    if (id === conversationId || loadingChat) return;
    setLoadingChat(true); setError('');
    try {
      const data = await api.copilotConversation(id);
      setConversationId(data.conversation.id); setConversation(toTurns(data.conversation.messages));
    } catch (err) { setError(err.message); } finally { setLoadingChat(false); }
  };
  const newChat = async () => {
    if (sending || loadingChat) return;
    setLoadingChat(true); setError('');
    try {
      const data = await api.createCopilotConversation('New conversation');
      setConversationId(data.conversation.id); setConversation([]); setMessage(''); setAttachments([]); setVoiceStatus(''); setVoiceTranscript('');
      await refreshRecentChats();
    } catch (err) { setError(err.message); } finally { setLoadingChat(false); }
  };
  const deleteConversation = async (event, id) => {
    event.preventDefault(); event.stopPropagation();
    if (!window.confirm('Delete this Copilot conversation?')) return;
    setError('');
    try {
      await api.deleteCopilotConversation(id);
      const remaining = recentChats.filter(item => item.id !== id); setRecentChats(remaining);
      if (conversationId === id) { setConversationId(null); setConversation([]); }
    } catch (err) { setError(err.message); }
  };
  const send = async event => {
    event?.preventDefault?.();
    if (sending) return;
    const trimmed = message.trim();
    const usableAttachments = attachments.filter(item => item.text).map(({ name, text }) => ({ name, text }));
    if (!trimmed && !usableAttachments.length) { setError('Write a question or attach a supported text file.'); return; }
    const userTurn = { id: `pending-${Date.now()}`, role: 'user', text: trimmed || 'Please review the attached file.', attachments: attachments.map(item => item.name) };
    setSending(true); setError(''); setConversation(current => [...current, userTurn]);
    try {
      const data = await api.copilotChat({ message: trimmed, attachments: usableAttachments, conversationId });
      setConversationId(data.conversation.id); setConversation(toTurns(data.conversation.messages)); setProvider(data.provider || provider);
      setMessage(''); setAttachments([]); setVoiceStatus(''); setVoiceTranscript('');
      await refreshRecentChats();
    } catch (err) {
      setError(err.message); setConversation(current => current.filter(item => item.id !== userTurn.id));
    } finally { setSending(false); }
  };
  const signalCards = [
    ['DSA momentum', stats ? `${stats.solved ?? 0} solved` : '—', stats?.solved ? 'Based on saved DSA completions.' : 'No solved DSA problem saved yet.'],
    ['Aptitude accuracy', stats?.aptitude?.accuracy == null ? '—' : `${stats.aptitude.accuracy}%`, stats?.aptitude?.attempted ? `${stats.aptitude.attempted} scored answers saved.` : 'Complete a set to unlock this signal.'],
    ['Interview practice', stats ? `${stats.interviews ?? 0} sessions` : '—', stats?.interviews ? 'Based on saved interview sessions.' : 'Practise one answer when ready.']
  ];

  return <WorkspaceLayout user={user}>
    <div className="ai-studio">
      <header className="ai-studio-head"><div><span className="ws-eyebrow">CAREERFORGE COPILOT</span><h1>One focused question<br />at a time.</h1><p>Ask for a roadmap, a study plan, an explanation, or help with your real CareerForge progress.</p></div><div className="ai-head-actions"><button type="button" className="ai-new-chat" onClick={newChat} disabled={loadingChat || sending}>＋ New chat</button><Link className="ai-review-link" to="/weekly-review">Weekly Review <span>↗</span></Link></div></header>
      <div className="ai-studio-grid">
        <section className="ai-stage" aria-live="polite">
          <div className={conversation.length ? 'ai-conversation has-turns' : 'ai-conversation'}>
            {conversation.length ? conversation.map(turn => <article className={`ai-turn ${turn.role}`} key={turn.id}>{turn.role === 'user' ? <><span>You</span><p>{turn.text}</p>{turn.attachments?.length ? <small>{turn.attachments.join(' · ')}</small> : null}</> : <><span>CareerForge Copilot · {turn.focus || 'Preparation plan'}</span><h2>{turn.answer}</h2>{turn.sections?.map((item, index) => <section className="ai-response-section" key={`${turn.id}-${index}`}><h3>{item.title}</h3>{item.content && <p>{item.content}</p>}{item.bullets?.length ? <ul>{item.bullets.map((bullet, bulletIndex) => <li key={bulletIndex}>{bullet}</li>)}</ul> : null}{item.code && <pre><code className={item.language ? `language-${item.language}` : undefined}>{item.code}</code></pre>}</section>)}{turn.actions?.length ? <div className="ai-turn-actions">{turn.actions.map(item => <Link key={`${turn.id}-${item.label}`} to={item.route}>{item.label} <i>↗</i></Link>)}</div> : null}</>}</article>) : <div className="ai-empty"><span className="ai-mark">✦</span><p className="ai-greeting">Hello, {firstName}</p><h2>I’m your career<br /><em>co-pilot.</em></h2><p>I use your current question first, then the relevant preparation data saved to your account.</p></div>}
            {sending && <article className="ai-thinking"><span>CareerForge Copilot is thinking…</span></article>}<div ref={conversationEndRef} />
          </div>
          {!conversation.length && <div className="ai-prompt-grid">{quickPrompts.map(([label, prompt]) => <button key={label} type="button" onClick={() => setMessage(prompt)}><span>{label}</span><b>{prompt}</b><i>↗</i></button>)}</div>}
          <form className="ai-composer" onSubmit={send}>
            <div className="ai-composer-row"><button type="button" className="ai-attach" onClick={() => inputRef.current?.click()} aria-label="Attach text or code files">＋</button><input ref={inputRef} className="ai-file-input" type="file" multiple accept=".txt,.md,.csv,.json,.js,.jsx,.ts,.tsx,.html,.css,.java,.py,.sql,text/plain,text/markdown,text/csv,application/json" onChange={addFiles} /><textarea value={message} onChange={event => setMessage(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="Ask about your next step…" maxLength="6000" />{speechSupported && <button className={recording ? 'ai-voice is-recording' : 'ai-voice'} type="button" onClick={recording ? stopVoice : startVoice} aria-label={recording ? 'Stop voice transcription' : 'Start voice transcription'}>{recording ? '■ Stop' : '◉ Voice'}</button>}<button className="ai-send" disabled={sending} aria-label="Send to CareerForge Copilot">{sending ? '…' : '↗'}</button></div>
            {attachments.length || voiceTranscript || voiceStatus || error ? <div className="ai-composer-meta">{attachments.map(item => <span className={item.unsupported ? 'ai-file-chip unsupported' : 'ai-file-chip'} key={item.id}><b>{item.name}</b> · {bytes(item.size)}{item.unsupported ? ` · ${item.note}` : ''}<button type="button" aria-label={`Remove ${item.name}`} onClick={() => setAttachments(current => current.filter(entry => entry.id !== item.id))}>×</button></span>)}{voiceTranscript && <div className="ai-transcript"><b>Voice transcript</b><span>{voiceTranscript}</span><small>Added to the message box — edit it before sending.</small></div>}{voiceStatus && <span className="ai-status">{voiceStatus}</span>}{error && <span className="ai-error">{error}<button type="button" onClick={() => void send()} disabled={sending}>Retry</button></span>}</div> : null}
            <p>Enter sends · Shift + Enter adds a line · Attach up to 3 text/code files (200 KB each){speechSupported ? ' · Voice transcription is optional and never sends automatically.' : ''}</p>
          </form>
        </section>
        <aside className="ai-insights"><div className="ai-insights-head"><div><span className="ws-eyebrow">YOUR SIGNALS</span><h2>Preparation pulse</h2></div><span className="ai-live">{provider?.configured ? 'AI' : 'LOCAL'}</span></div>{signalCards.map(([label, value, description], index) => <article className={`ai-signal signal-${index}`} key={label}><span>{label}</span><strong>{value}</strong><p>{description}</p></article>)}<div className="ai-recent"><div><span className="ws-eyebrow">RECENT CHATS</span><button type="button" onClick={newChat} disabled={loadingChat || sending}>New</button></div>{recentChats.length ? recentChats.slice(0, 6).map(item => <button type="button" className={item.id === conversationId ? 'active' : ''} onClick={() => void openConversation(item.id)} key={item.id}><span>{item.title}</span><small>{new Date(item.updatedAt).toLocaleDateString()}</small><i onClick={event => void deleteConversation(event, item.id)} role="button" aria-label={`Delete ${item.title}`}>×</i></button>) : <p>No saved chats yet.</p>}</div><div className="ai-insight-actions"><span className="ws-eyebrow">COPILOT TOOLS</span><Link to="/dsa">Explore DSA roadmap <i>↗</i></Link><Link to="/aptitude">Open aptitude practice <i>↗</i></Link><Link to="/interviews">Start interview practice <i>↗</i></Link></div></aside>
      </div>
    </div>
  </WorkspaceLayout>;
}
