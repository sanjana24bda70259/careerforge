import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { WorkspaceLayout } from './Workspace.jsx';
import '../aiHelp.css';

const quickPrompts = [
  ['DSA roadmap', 'Help me plan my next DSA practice session'],
  ['Resume bullet', 'Explain how to improve a project resume bullet'],
  ['Aptitude method', 'How should I approach an aptitude percentage question?'],
  ['Interview answer', 'Help me prepare a concise interview answer']
];
const textExtensions = new Set(['txt', 'md', 'csv', 'json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'java', 'py', 'sql']);
const readableFile = file => file.type.startsWith('text/') || textExtensions.has(file.name.split('.').at(-1)?.toLowerCase());
const bytes = value => value < 1024 ? `${value} B` : `${(value / 1024).toFixed(1)} KB`;

export function AiHelpPanel({ user }) {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceNote, setVoiceNote] = useState(null);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [progress, setProgress] = useState(null);
  const inputRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const chunksRef = useRef([]);
  const speechSupported = useMemo(() => typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition), []);
  const firstName = user?.profile?.name?.trim().split(/\s+/)[0] || 'there';
  const stats = progress?.stats;

  useEffect(() => {
    let active = true;
    void api.dashboard().then(data => { if (active) setProgress(data); }).catch(() => { if (active) setProgress({ stats: null }); });
    return () => { active = false; };
  }, []);
  useEffect(() => () => {
    recognitionRef.current?.stop?.();
    streamRef.current?.getTracks().forEach(track => track.stop());
    if (voiceNote?.url) URL.revokeObjectURL(voiceNote.url);
  }, [voiceNote?.url]);

  const appendTranscript = text => {
    const cleaned = text.trim();
    if (!cleaned) return;
    setMessage(current => `${current}${current && !current.endsWith(' ') ? ' ' : ''}${cleaned}`.trimStart());
    setVoiceTranscript(current => `${current}${current && !current.endsWith(' ') ? ' ' : ''}${cleaned}`.trimStart());
  };
  const stopVoice = () => {
    recognitionRef.current?.stop?.();
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    else { streamRef.current?.getTracks().forEach(track => track.stop()); setRecording(false); }
  };
  const startVoice = async () => {
    setError('');
    setVoiceStatus('');
    setVoiceTranscript('');
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('Voice recording is not available in this browser. You can still type your question.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = event => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setVoiceNote({ name: `Voice note ${new Date().toLocaleTimeString()}`, url, size: blob.size });
        stream.getTracks().forEach(track => track.stop());
        setRecording(false);
        setVoiceStatus(speechSupported ? 'Recording stopped. Review or edit the transcript before sending.' : 'Recording saved in this browser. This browser cannot create a transcript automatically.');
      };
      recorder.start();
      setRecording(true);
      setVoiceStatus(speechSupported ? 'Recording and transcribing with your browser…' : 'Recording locally…');
      if (speechSupported) {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new Recognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = navigator.language || 'en-US';
        recognition.onresult = event => {
          let transcript = '';
          for (let index = event.resultIndex; index < event.results.length; index += 1) if (event.results[index].isFinal) transcript += event.results[index][0].transcript;
          appendTranscript(transcript);
        };
        recognition.onerror = event => {
          if (event.error !== 'aborted' && event.error !== 'no-speech') setVoiceStatus('Recording saved. Voice transcription was unavailable; you can type or edit your message.');
        };
        recognition.start();
      }
    } catch (err) {
      recognitionRef.current?.stop?.();
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      else streamRef.current?.getTracks().forEach(track => track.stop());
      setRecording(false);
      setError(err.name === 'NotAllowedError' ? 'Microphone access was not granted. Allow it in the browser to record a voice note.' : 'Could not start recording. Please try again or type your question.');
    }
  };
  const addFiles = async event => {
    const files = Array.from(event.target.files || []).slice(0, 3);
    event.target.value = '';
    setError('');
    const next = await Promise.all(files.map(async file => {
      if (file.size > 200 * 1024) return { id: `${file.name}-${file.lastModified}`, name: file.name, size: file.size, unsupported: true, note: 'Files above 200 KB are not read.' };
      if (!readableFile(file)) return { id: `${file.name}-${file.lastModified}`, name: file.name, size: file.size, unsupported: true, note: 'Choose a text, code, CSV, Markdown, or JSON file.' };
      return { id: `${file.name}-${file.lastModified}`, name: file.name, size: file.size, text: (await file.text()).slice(0, 8000) };
    }));
    setAttachments(current => [...current, ...next].slice(0, 3));
  };
  const send = async event => {
    event?.preventDefault?.();
    const trimmed = message.trim();
    const usableAttachments = attachments.filter(item => item.text).map(({ name, text }) => ({ name, text }));
    if (!trimmed && !usableAttachments.length) { setError('Write a question or attach a supported text file.'); return; }
    const userTurn = { id: `${Date.now()}-user`, role: 'user', text: trimmed || 'Please review the attached file.', attachments: attachments.map(item => item.name) };
    setSending(true);
    setError('');
    setConversation(current => [...current, userTurn]);
    try {
      const reply = await api.coach({ message: trimmed, attachments: usableAttachments });
      setConversation(current => [...current, { id: `${Date.now()}-coach`, role: 'coach', ...reply }]);
      setMessage('');
      setAttachments([]);
      setVoiceNote(null);
      setVoiceStatus('');
      setVoiceTranscript('');
    } catch (err) {
      setError(err.message);
      setConversation(current => current.filter(item => item.id !== userTurn.id));
    } finally {
      setSending(false);
    }
  };
  const signalCards = [
    ['DSA momentum', stats ? `${stats.solved ?? 0} solved` : '—', stats?.solved ? 'Keep the next pattern focused.' : 'Start with one small problem.'],
    ['Aptitude accuracy', stats?.aptitude?.accuracy == null ? '—' : `${stats.aptitude.accuracy}%`, stats?.aptitude?.attempted ? `${stats.aptitude.attempted} real attempts saved.` : 'Complete a set to unlock this signal.'],
    ['Interview practice', stats ? `${stats.interviews ?? 0} sessions` : '—', stats?.interviews ? 'Review your latest feedback.' : 'Practise one answer when ready.']
  ];

  return <WorkspaceLayout user={user}>
    <div className="ai-studio">
      <header className="ai-studio-head"><div><span className="ws-eyebrow">CAREERFORGE AI COACH</span><h1>One focused question<br />at a time.</h1><p>Use your real preparation context to turn uncertainty into a clear next step.</p></div><Link className="ai-review-link" to="/weekly-review">Weekly Review <span>↗</span></Link></header>
      <div className="ai-studio-grid">
        <section className="ai-stage" aria-live="polite">
          <div className={conversation.length ? 'ai-conversation has-turns' : 'ai-conversation'}>
            {conversation.length ? conversation.map(turn => <article className={`ai-turn ${turn.role}`} key={turn.id}>{turn.role === 'user' ? <><span>You</span><p>{turn.text}</p>{turn.attachments?.length ? <small>{turn.attachments.join(' · ')}</small> : null}</> : <><span>CareerForge Coach · {turn.focus || 'Preparation plan'}</span><h2>{turn.answer}</h2>{turn.context && <small>{turn.context}</small>}<ol>{turn.actions?.map(action => <li key={action}>{action}</li>)}</ol></>}</article>) : <div className="ai-empty"><span className="ai-mark">✦</span><p className="ai-greeting">Hello, {firstName}</p><h2>I’m your preparation<br /><em>co-pilot.</em></h2><p>Ask about DSA patterns, aptitude methods, project bullets, or a practice plan that fits today.</p></div>}
          </div>
          {!conversation.length && <div className="ai-prompt-grid">{quickPrompts.map(([label, prompt]) => <button key={label} type="button" onClick={() => setMessage(prompt)}><span>{label}</span><b>{prompt}</b><i>↗</i></button>)}</div>}
          <form className="ai-composer" onSubmit={send}>
            <div className="ai-composer-row"><button type="button" className="ai-attach" onClick={() => inputRef.current?.click()} aria-label="Attach files">＋</button><input ref={inputRef} className="ai-file-input" type="file" multiple accept=".txt,.md,.csv,.json,.js,.jsx,.ts,.tsx,.html,.css,.java,.py,.sql,text/plain,text/markdown,text/csv,application/json" onChange={addFiles} /><textarea value={message} onChange={event => setMessage(event.target.value)} placeholder="Ask about your next step…" maxLength="6000" /><button className={recording ? 'ai-voice is-recording' : 'ai-voice'} type="button" onClick={recording ? stopVoice : startVoice} aria-label={recording ? 'Stop recording' : 'Record voice note'}>{recording ? '■ Stop' : '◉ Voice'}</button><button className="ai-send" disabled={sending} aria-label="Send to CareerForge Coach">{sending ? '…' : '↗'}</button></div>
            {attachments.length || voiceNote || voiceTranscript || voiceStatus || error ? <div className="ai-composer-meta">{attachments.map(item => <span className={item.unsupported ? 'ai-file-chip unsupported' : 'ai-file-chip'} key={item.id}><b>{item.name}</b> · {bytes(item.size)}{item.unsupported ? ` · ${item.note}` : ''}<button type="button" aria-label={`Remove ${item.name}`} onClick={() => setAttachments(current => current.filter(entry => entry.id !== item.id))}>×</button></span>)}{voiceNote && <div className="ai-voice-note"><b>{voiceNote.name}</b><audio controls src={voiceNote.url}>Your browser cannot play this recording.</audio><span>{bytes(voiceNote.size)} · stored in browser</span><button type="button" aria-label="Remove voice note" onClick={() => { URL.revokeObjectURL(voiceNote.url); setVoiceNote(null); }}>×</button></div>}{voiceTranscript && <div className="ai-transcript"><b>Voice transcript</b><span>{voiceTranscript}</span><small>Added to the message box — edit it before sending.</small></div>}{voiceStatus && <span className="ai-status">{voiceStatus}</span>}{error && <span className="ai-error">{error}</span>}</div> : null}
            <p>Attach up to 3 text/code files · Voice transcription depends on your browser · Nothing sends until you choose Send.</p>
          </form>
        </section>
        <aside className="ai-insights"><div className="ai-insights-head"><div><span className="ws-eyebrow">YOUR SIGNALS</span><h2>Preparation pulse</h2></div><span className="ai-live">LIVE</span></div>{signalCards.map(([label, value, description], index) => <article className={`ai-signal signal-${index}`} key={label}><span>{label}</span><strong>{value}</strong><p>{description}</p></article>)}<div className="ai-insight-actions"><span className="ws-eyebrow">COACH TOOLS</span><Link to="/dsa">Explore DSA roadmap <i>↗</i></Link><Link to="/aptitude">Open aptitude practice <i>↗</i></Link><Link to="/interviews">Start interview practice <i>↗</i></Link></div></aside>
      </div>
    </div>
  </WorkspaceLayout>;
}
