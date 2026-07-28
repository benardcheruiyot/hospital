import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../services/socket.js';

const ICE_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

/**
 * Manages a single peer-to-peer WebRTC call for a telemedicine room, signaling
 * over the already-connected Socket.IO client.
 */
export default function useWebRTC(roomCode) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const screenTrackRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [sharingScreen, setSharingScreen] = useState(false);
  const [diagnostics, setDiagnostics] = useState({
    socketConnected: false,
    connectionState: 'new',
    iceConnectionState: 'new',
    signalingState: 'stable',
    localMediaReady: false,
    remoteMediaReady: false,
  });

  const createPeerConnection = useCallback((targetRoomCode) => {
    const socket = getSocket();
    const pc = new RTCPeerConnection(ICE_SERVERS);

    setDiagnostics((prev) => ({
      ...prev,
      socketConnected: Boolean(socket?.connected),
      connectionState: pc.connectionState,
      iceConnectionState: pc.iceConnectionState,
      signalingState: pc.signalingState,
    }));

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('telemedicine:signal', {
          roomCode: targetRoomCode,
          signal: { type: 'ice-candidate', candidate: event.candidate },
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        [remoteVideoRef.current.srcObject] = event.streams;
      }
      setConnected(true);
      setDiagnostics((prev) => ({ ...prev, remoteMediaReady: true }));
    };

    pc.onconnectionstatechange = () => {
      setDiagnostics((prev) => ({ ...prev, connectionState: pc.connectionState }));
    };

    pc.oniceconnectionstatechange = () => {
      setDiagnostics((prev) => ({ ...prev, iceConnectionState: pc.iceConnectionState }));
    };

    pc.onsignalingstatechange = () => {
      setDiagnostics((prev) => ({ ...prev, signalingState: pc.signalingState }));
    };

    peerConnectionRef.current = pc;
    return pc;
  }, []);

  const startCall = useCallback(async (overrideRoomCode) => {
    const targetRoomCode = overrideRoomCode || roomCode;
    const socket = getSocket();
    if (!targetRoomCode) {
      setError('Telemedicine room is missing. Please rejoin the session.');
      return false;
    }

    if (!socket) {
      setError('Not connected to the real-time server.');
      setDiagnostics((prev) => ({ ...prev, socketConnected: false }));
      return false;
    }

    setDiagnostics((prev) => ({ ...prev, socketConnected: socket.connected }));

    if (localStreamRef.current && peerConnectionRef.current) {
      return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      cameraTrackRef.current = stream.getVideoTracks()[0] || null;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setDiagnostics((prev) => ({
        ...prev,
        localMediaReady: stream.getTracks().length > 0,
      }));

      const pc = createPeerConnection(targetRoomCode);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      socket.emit('telemedicine:join', { roomCode: targetRoomCode });

      socket.off('telemedicine:peer-joined');
      socket.off('telemedicine:signal');
      socket.off('telemedicine:peer-left');

      socket.on('telemedicine:peer-joined', async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('telemedicine:signal', {
          roomCode: targetRoomCode,
          signal: { type: 'offer', sdp: offer },
        });
      });

      socket.on('telemedicine:signal', async ({ signal }) => {
        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('telemedicine:signal', {
            roomCode: targetRoomCode,
            signal: { type: 'answer', sdp: answer },
          });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        } else if (signal.type === 'ice-candidate') {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (err) {
            console.error('Error adding received ICE candidate', err);
          }
        }
      });

      socket.on('telemedicine:peer-left', () => {
        setConnected(false);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        setDiagnostics((prev) => ({ ...prev, remoteMediaReady: false }));
      });

      return true;
    } catch (err) {
      setError('Could not access camera/microphone. Please check permissions.');
      setDiagnostics((prev) => ({ ...prev, localMediaReady: false }));
      return false;
    }
  }, [roomCode, createPeerConnection]);

  const endCall = useCallback((overrideRoomCode) => {
    const targetRoomCode = overrideRoomCode || roomCode;
    const socket = getSocket();
    if (targetRoomCode) {
      socket?.emit('telemedicine:leave', { roomCode: targetRoomCode });
    }
    socket?.off('telemedicine:peer-joined');
    socket?.off('telemedicine:signal');
    socket?.off('telemedicine:peer-left');
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    cameraTrackRef.current = null;
    setSharingScreen(false);
    setConnected(false);
    setDiagnostics((prev) => ({
      ...prev,
      connectionState: 'closed',
      iceConnectionState: 'closed',
      signalingState: 'closed',
      localMediaReady: false,
      remoteMediaReady: false,
    }));
  }, [roomCode]);

  const stopScreenShare = useCallback(async () => {
    if (!screenTrackRef.current || !peerConnectionRef.current || !cameraTrackRef.current) {
      return;
    }

    const sender = peerConnectionRef.current
      .getSenders()
      .find((item) => item.track && item.track.kind === 'video');

    if (sender) {
      await sender.replaceTrack(cameraTrackRef.current);
    }

    if (localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    screenTrackRef.current.stop();
    screenTrackRef.current = null;
    setSharingScreen(false);
  }, []);

  const shareScreen = useCallback(async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const displayTrack = displayStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current
        ?.getSenders()
        .find((item) => item.track && item.track.kind === 'video');

      if (!displayTrack || !sender) {
        throw new Error('Screen sharing is not available for this call.');
      }

      await sender.replaceTrack(displayTrack);
      screenTrackRef.current = displayTrack;
      setSharingScreen(true);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = new MediaStream([displayTrack]);
      }

      displayTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      setError(err.message || 'Unable to start screen sharing.');
    }
  }, [stopScreenShare]);

  useEffect(() => {
    return () => {
      const socket = getSocket();
      socket?.off('telemedicine:peer-joined');
      socket?.off('telemedicine:signal');
      socket?.off('telemedicine:peer-left');
      peerConnectionRef.current?.close();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenTrackRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    localVideoRef,
    remoteVideoRef,
    connected,
    error,
    sharingScreen,
    diagnostics,
    startCall,
    endCall,
    shareScreen,
    stopScreenShare,
  };
}
