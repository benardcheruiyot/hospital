import React, { useEffect, useRef, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getThread, markThreadAsRead, sendMessage } from '../services/messageApi.js';
import { parseStructuredMessageBody } from '../utils/contentParsers.js';

const TRIAGE_OPTIONS = [
  { label: 'Triage', value: 'triage', template: 'I need advice about a symptom before my next visit.' },
  { label: 'Billing', value: 'billing', template: 'I need help understanding a charge or invoice.' },
  { label: 'Pharmacy', value: 'pharmacy', template: 'I have a question about a prescription or refill.' },
  { label: 'Follow-up', value: 'follow_up', template: 'I have a follow-up question after my recent consultation.' },
  { label: 'Emergency', value: 'urgent', template: 'I am experiencing symptoms and need urgent guidance.' },
];

export default function MessagesPage() {
  const { user, refreshUnreadCount } = useAuth();
  const [thread, setThread] = useState([]);
  const [draft, setDraft] = useState('');
  const [draftCategory, setDraftCategory] = useState('follow_up');
  const [attachment, setAttachment] = useState(null);
  const [loadingThread, setLoadingThread] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    const loadThread = async () => {
      setLoadingThread(true);
      try {
        const { data } = await getThread();
        setThread(data || []);
        await markThreadAsRead();
        refreshUnreadCount();
      } catch {
        setError('Unable to load your support conversation.');
      } finally {
        setLoadingThread(false);
      }
    };

    loadThread();
  }, [refreshUnreadCount]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const handleAttachmentUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({ name: file.name, type: file.type, dataUrl: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;

    setSendingMessage(true);
    setError('');
    try {
      const { data } = await sendMessage({
        body: draft,
        category: draftCategory,
        attachment,
      });
      setThread((prev) => [...prev, data.message, data.reply]);
      setDraft('');
      setAttachment(null);
      setMessage('Your question was sent. A support reply is already waiting below.');
    } catch {
      setError('Unable to send your support question.');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <AppShell>
      <section className="hero-card">
        <div>
          <div className="page-eyebrow">Secure communication</div>
          <h2 style={{ margin: '4px 0 10px' }}>Support messages</h2>
          <p className="section-copy" style={{ maxWidth: 720 }}>
            Ask questions here for automatic support replies or follow-up from the care team. This channel is for patients only, and it is not for emergencies.
          </p>
        </div>
        <div className="triage-tags">
          <span className="tag">Auto reply</span>
          <span className="tag">Support team</span>
          <span className="tag">Patient only</span>
          <span className="tag">Not for emergencies</span>
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="grid grid-2 dashboard-layout">
        <div className="card accent-card">
          <div className="page-eyebrow">Suggested prompts</div>
          <h3 style={{ marginTop: 4 }}>Start with a common question</h3>
          <div className="info-list compact-list">
            <div className="info-row">
              <strong>Clinical question</strong>
              <span>Ask about a symptom, medication, or follow-up concern.</span>
            </div>
            <div className="info-row">
              <strong>Billing question</strong>
              <span>Ask about a charge, invoice, receipt, or payment issue.</span>
            </div>
            <div className="info-row">
              <strong>Pharmacy question</strong>
              <span>Ask about a refill, prescription, or medication instruction.</span>
            </div>
          </div>
          <div className="triage-tags" style={{ marginTop: 16, justifyContent: 'flex-start' }}>
            {TRIAGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                className="tag-button"
                type="button"
                onClick={() => {
                  setDraftCategory(option.value === 'urgent' ? 'triage' : option.value);
                  setDraft(option.template);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <div>
              <div className="page-eyebrow">Support thread</div>
              <h3 style={{ margin: '4px 0 0' }}>Care Support Bot</h3>
            </div>
            <span className="badge badge-confirmed">Automatic replies enabled</span>
          </div>
          <p className="section-copy" style={{ marginTop: 0 }}>
            This channel is for patients only. The first reply is automatic, and the support team can follow up here when needed.
          </p>
          {loadingThread ? (
            <div className="loading-panel" style={{ minHeight: 220 }}>
              <div className="status-spinner" />
              <p className="section-copy" style={{ margin: 0 }}>Loading your support thread...</p>
            </div>
          ) : (
            <>
              <div className="chat-thread">
                {thread.length === 0 ? (
                  <div className="summary-block">
                    <strong>Start the conversation</strong>
                    <p className="section-copy" style={{ marginBottom: 0 }}>
                      Ask a question and the support bot will answer right away.
                    </p>
                  </div>
                ) : (
                  thread.map((msg) => {
                    const parsed = parseStructuredMessageBody(msg.body);
                    return (
                      <div
                        key={msg.id}
                        className={`chat-bubble ${msg.senderId === user.id ? 'mine' : 'theirs'}`}
                      >
                        <div className="bubble-meta-row">
                          <span className="bubble-tag">{parsed.category.replace('_', ' ')}</span>
                          {msg.senderId !== user.id && <span className="bubble-tag">support</span>}
                        </div>
                        <div>{parsed.text}</div>
                        {parsed.attachment && (
                          <a className="attachment-link" href={parsed.attachment.dataUrl} download={parsed.attachment.name}>
                            {parsed.attachment.name}
                          </a>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSend} className="composer-form">
                <div className="grid grid-2">
                  <select value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)}>
                    {TRIAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value === 'urgent' ? 'triage' : option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input type="file" accept="image/*,.pdf" onChange={handleAttachmentUpload} />
                </div>
                {attachment && <div className="field-hint">Attachment ready: {attachment.name}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <input
                    style={{ flex: 1 }}
                    placeholder="Ask the support bot or care team..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <button className="btn" type="submit" disabled={sendingMessage}>
                    {sendingMessage ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
