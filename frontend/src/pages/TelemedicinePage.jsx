import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import useWebRTC from '../hooks/useWebRTC.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getSessionByRoomCode,
  listTelemedicineSessions,
  saveTelemedicineSummary,
  startTelemedicineSession,
  endTelemedicineSession,
} from '../services/telemedicineApi.js';
import { parseAppointmentNotes } from '../utils/contentParsers.js';

export default function TelemedicinePage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [error, setError] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [summaryForm, setSummaryForm] = useState({
    consultationSummary: '',
    followUpDirectives: '',
    prescriptionNotes: '',
  });
  const [savingSummary, setSavingSummary] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);

  const loadSessions = useCallback(() => {
    setLoadingSessions(true);
    listTelemedicineSessions()
      .then(({ data }) => setSessions(data))
      .catch(() => setError('Unable to load telemedicine sessions.'))
      .finally(() => setLoadingSessions(false));
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const {
    localVideoRef,
    remoteVideoRef,
    connected,
    error: rtcError,
    sharingScreen,
    diagnostics,
    startCall,
    endCall,
    shareScreen,
    stopScreenShare,
  } = useWebRTC(activeRoom);

  const waitingCount = sessions.filter((session) => session.status !== 'ended').length;
  const activeCount = sessions.filter((session) => session.status === 'active').length;
  const activeNotes = useMemo(
    () => parseAppointmentNotes(activeSession?.Appointment?.notes),
    [activeSession]
  );

  useEffect(() => {
    setSummaryForm({
      consultationSummary: activeNotes.consultationSummary,
      followUpDirectives: activeNotes.followUpDirectives,
      prescriptionNotes: activeNotes.prescriptionNotes,
    });
  }, [activeNotes]);

  useEffect(() => {
    if (!activeRoom) return undefined;

    let cancelled = false;
    const refreshActiveSession = () => {
      getSessionByRoomCode(activeRoom)
        .then(({ data }) => {
          if (!cancelled) {
            setActiveSession(data);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setError('Unable to refresh session details in real time.');
          }
        });
    };

    refreshActiveSession();
    const intervalId = window.setInterval(refreshActiveSession, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeRoom]);

  const handleJoin = async (roomCode) => {
    setJoiningRoom(true);
    setError('');
    try {
      await startTelemedicineSession(roomCode);
      const sessionResponse = await getSessionByRoomCode(roomCode);
      setActiveRoom(roomCode);
      setActiveSession(sessionResponse.data);
      const callStarted = await startCall(roomCode);
      setMediaReady(Boolean(callStarted));
      if (!callStarted) {
        setError('Joined room, but camera or microphone is not ready. Use "Retry camera/mic" below.');
      }
    } catch {
      setError('Unable to start the telemedicine session.');
      setActiveRoom(null);
      setActiveSession(null);
      setMediaReady(false);
      endCall(roomCode);
    } finally {
      setJoiningRoom(false);
    }
  };

  const handleRetryMedia = async () => {
    setError('');
    const callStarted = await startCall(activeRoom);
    setMediaReady(Boolean(callStarted));
    if (!callStarted) {
      setError('Still unable to access camera/microphone. Check browser permissions and retry.');
    }
  };

  const handleEnd = async () => {
    endCall(activeRoom);
    if (activeRoom) {
      try {
        await endTelemedicineSession(activeRoom);
      } catch {
        // Non-fatal end-call cleanup.
      }
    }
    setActiveRoom(null);
    setActiveSession(null);
    setMediaReady(false);
    loadSessions();
  };

  const handleSaveSummary = async (e) => {
    e.preventDefault();
    if (!activeRoom) return;

    setSavingSummary(true);
    setError('');
    try {
      const { data } = await saveTelemedicineSummary(activeRoom, summaryForm);
      setActiveSession(data);
      loadSessions();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save the consultation summary.');
    } finally {
      setSavingSummary(false);
    }
  };

  return (
    <AppShell>
      <section className="hero-card">
        <div>
          <div className="page-eyebrow">Virtual care</div>
          <h2 style={{ margin: '4px 0 10px' }}>Telemedicine</h2>
          <p className="section-copy" style={{ maxWidth: 720 }}>
            Launch browser-based consultations, move patients through a virtual waiting room, use dual-screen clinical tools, and push post-consultation summaries back into the care workflow.
          </p>
        </div>
        <div className="hero-actions hero-summary">
          <div className="hero-metric">
            <span>Waiting rooms</span>
            <strong>{waitingCount}</strong>
          </div>
          <div className="hero-metric">
            <span>Live sessions</span>
            <strong>{activeCount}</strong>
          </div>
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}
      {rtcError && <div className="alert alert-error">{rtcError}</div>}

      {!activeRoom ? (
        <div className="grid grid-2 dashboard-layout">
          <div className="card telemedicine-room-list-card">
            <div className="section-header">
              <div>
                <div className="page-eyebrow">Virtual waiting room</div>
                <h3 style={{ margin: '4px 0 0' }}>Your virtual consultations</h3>
              </div>
            </div>
            {loadingSessions ? (
              <p style={{ color: 'var(--color-muted)' }}>Loading telemedicine sessions...</p>
            ) : sessions.length === 0 ? (
              <p style={{ color: 'var(--color-muted)' }}>
                No telemedicine sessions yet. Schedule a telemedicine appointment to create one.
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td>{session.roomCode}</td>
                      <td>
                        <span
                          className={`badge badge-${
                            session.status === 'active' ? 'confirmed' : 'scheduled'
                          }`}
                        >
                          {session.status}
                        </span>
                      </td>
                      <td>{session.Appointment?.reason || 'General consultation'}</td>
                      <td>
                        <button
                          className="btn"
                          disabled={joiningRoom}
                          onClick={() => handleJoin(session.roomCode)}
                        >
                          {joiningRoom ? 'Joining...' : 'Join call'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="grid page-stack telemedicine-side-stack">
            <div className="card accent-card">
              <div className="page-eyebrow">Pre-call checklist</div>
              <h3 style={{ marginTop: 4 }}>Before you join</h3>
              <div className="info-list compact-list">
                <div className="info-row">
                  <strong>Camera and audio</strong>
                  <span>Allow browser permissions so the WebRTC session can connect immediately.</span>
                </div>
                <div className="info-row">
                  <strong>Dual-screen review</strong>
                  <span>Keep your appointment reason and patient context visible alongside the video visit.</span>
                </div>
                <div className="info-row">
                  <strong>Reference materials</strong>
                  <span>Keep medication details, recent symptoms, or prior documents nearby.</span>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="page-eyebrow">Workflow note</div>
              <h3 style={{ marginTop: 4 }}>Integrated virtual care</h3>
              <p className="section-copy" style={{ marginBottom: 0 }}>
                Use appointments to create the visit, messages for asynchronous follow-up, and telemedicine for the live consultation itself.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-2 dashboard-layout">
          <div className="card">
            <h3 style={{ marginTop: 0 }}>
              Consultation room: {activeRoom}{' '}
              <span className={`badge badge-${connected ? 'confirmed' : 'scheduled'}`}>
                {connected ? 'connected' : 'waiting for peer'}
              </span>
            </h3>
            <p className="section-copy">
              Stay on this page during the consultation. If the other participant has not joined yet, keep the room open and verify browser permissions.
            </p>
            {!mediaReady && (
              <div className="alert alert-error">
                Camera/microphone not active yet. Retry media setup to continue the call.
              </div>
            )}
            <div className="video-grid">
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                  {sharingScreen ? 'Your shared screen' : 'You'}
                </p>
                <video ref={localVideoRef} autoPlay playsInline muted />
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Other participant</p>
                <video ref={remoteVideoRef} autoPlay playsInline />
              </div>
            </div>
            <div className="table-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-secondary" type="button" onClick={handleRetryMedia}>
                Retry camera/mic
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={sharingScreen ? stopScreenShare : shareScreen}
                disabled={!mediaReady}
              >
                {sharingScreen ? 'Stop screen sharing' : 'Share screen'}
              </button>
              <button className="btn btn-danger" type="button" onClick={handleEnd}>
                End call
              </button>
            </div>
            <div className="card" style={{ marginTop: 16, background: 'rgba(10, 26, 57, 0.03)' }}>
              <div className="page-eyebrow">Connection diagnostics</div>
              <h4 style={{ margin: '4px 0 12px' }}>Session health</h4>
              <div className="info-list compact-list">
                <div className="info-row">
                  <strong>Signal server</strong>
                  <span>{diagnostics.socketConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
                <div className="info-row">
                  <strong>Peer connection</strong>
                  <span>{diagnostics.connectionState}</span>
                </div>
                <div className="info-row">
                  <strong>ICE state</strong>
                  <span>{diagnostics.iceConnectionState}</span>
                </div>
                <div className="info-row">
                  <strong>Signaling state</strong>
                  <span>{diagnostics.signalingState}</span>
                </div>
                <div className="info-row">
                  <strong>Local media tracks</strong>
                  <span>{diagnostics.localMediaReady ? 'Ready' : 'Missing'}</span>
                </div>
                <div className="info-row">
                  <strong>Remote media tracks</strong>
                  <span>{diagnostics.remoteMediaReady ? 'Detected' : 'Not detected'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid page-stack">
            <div className="card accent-card">
              <div className="page-eyebrow">Dual-screen clinical tools</div>
              <h3 style={{ marginTop: 4 }}>Consultation context</h3>
              <div className="info-list compact-list">
                <div className="info-row">
                  <strong>Appointment reason</strong>
                  <span>{activeSession?.Appointment?.reason || 'General consultation'}</span>
                </div>
                <div className="info-row">
                  <strong>Patient</strong>
                  <span>
                    {activeSession?.Patient?.User?.firstName} {activeSession?.Patient?.User?.lastName}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Provider</strong>
                  <span>
                    Dr. {activeSession?.Doctor?.User?.firstName} {activeSession?.Doctor?.User?.lastName}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Allergies</strong>
                  <span>{activeSession?.Patient?.allergies || 'No allergies recorded'}</span>
                </div>
                <div className="info-row">
                  <strong>Blood group</strong>
                  <span>{activeSession?.Patient?.bloodGroup || 'Not recorded'}</span>
                </div>
              </div>
            </div>

            {(user.role === 'doctor' || user.role === 'admin') ? (
              <form className="card" onSubmit={handleSaveSummary}>
                <div className="page-eyebrow">Post-consultation summary</div>
                <h3 style={{ marginTop: 4 }}>Capture visit outcome</h3>
                <div className="form-group">
                  <label>Consultation summary</label>
                  <textarea
                    rows={4}
                    value={summaryForm.consultationSummary}
                    onChange={(e) =>
                      setSummaryForm((prev) => ({ ...prev, consultationSummary: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Follow-up directives</label>
                  <textarea
                    rows={3}
                    value={summaryForm.followUpDirectives}
                    onChange={(e) =>
                      setSummaryForm((prev) => ({ ...prev, followUpDirectives: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Prescription or care notes</label>
                  <textarea
                    rows={3}
                    value={summaryForm.prescriptionNotes}
                    onChange={(e) =>
                      setSummaryForm((prev) => ({ ...prev, prescriptionNotes: e.target.value }))
                    }
                  />
                </div>
                <button className="btn" disabled={savingSummary} type="submit">
                  {savingSummary ? 'Saving...' : 'Save summary'}
                </button>
              </form>
            ) : (
              <div className="card">
                <div className="page-eyebrow">Post-consultation summary</div>
                <h3 style={{ marginTop: 4 }}>Visit recap</h3>
                <div className="summary-block">
                  <p>{activeNotes.consultationSummary || 'Your provider has not published a summary yet.'}</p>
                  {activeNotes.followUpDirectives && <p>Follow-up: {activeNotes.followUpDirectives}</p>}
                  {activeNotes.prescriptionNotes && <p>Care notes: {activeNotes.prescriptionNotes}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
