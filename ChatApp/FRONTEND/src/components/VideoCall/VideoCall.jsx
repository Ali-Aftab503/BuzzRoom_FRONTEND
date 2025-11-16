import { useState, useEffect, useRef } from 'react';

const VideoCall = ({ 
  callId, 
  isInitiator, 
  otherUserName, 
  socket, 
  onEndCall,
  callType = 'video',
  roomId
}) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState('connecting');
  const [error, setError] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const pendingCandidates = useRef([]);

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ],
    iceCandidatePoolSize: 10
  };

  useEffect(() => {
    console.log('🚀 Starting video call setup...');
    initCall();
    
    return () => {
      console.log('🧹 Cleaning up call...');
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    console.log('📡 Setting up WebRTC signaling listeners');

    const handleSignal = async ({ signal }) => {
      console.log('📥 Received signal:', signal.type);

      if (!peerConnectionRef.current) {
        console.error('❌ No peer connection!');
        return;
      }

      try {
        if (signal.type === 'offer') {
          console.log('📝 Setting remote offer...');
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
          
          // Add any pending candidates
          for (const candidate of pendingCandidates.current) {
            await peerConnectionRef.current.addIceCandidate(candidate);
          }
          pendingCandidates.current = [];

          console.log('📤 Creating answer...');
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          
          socket.emit('webrtc-signal', { 
            roomId, 
            signal: { type: 'answer', sdp: answer.sdp } 
          });
          console.log('✅ Answer sent');

        } else if (signal.type === 'answer') {
          console.log('📝 Setting remote answer...');
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
          
          // Add any pending candidates
          for (const candidate of pendingCandidates.current) {
            await peerConnectionRef.current.addIceCandidate(candidate);
          }
          pendingCandidates.current = [];
          
          console.log('✅ Answer set successfully');

        } else if (signal.type === 'ice-candidate' && signal.candidate) {
          console.log('🧊 Received ICE candidate');
          
          if (peerConnectionRef.current.remoteDescription) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
            console.log('✅ ICE candidate added');
          } else {
            console.log('⏳ Queuing ICE candidate...');
            pendingCandidates.current.push(new RTCIceCandidate(signal.candidate));
          }
        }
      } catch (err) {
        console.error('❌ Signal handling error:', err);
      }
    };

    socket.on('webrtc-signal', handleSignal);

    return () => {
      socket.off('webrtc-signal', handleSignal);
    };
  }, [socket, roomId]);

  const initCall = async () => {
    try {
      console.log('🎥 Requesting media...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video' ? { width: 1280, height: 720 } : false,
        audio: true
      });

      console.log('✅ Got local stream');
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;
      console.log('✅ Peer connection created');

      // Add tracks
      stream.getTracks().forEach(track => {
        console.log('➕ Adding track:', track.kind);
        pc.addTrack(track, stream);
      });

      // Handle incoming tracks
      pc.ontrack = (event) => {
        console.log('📥 Received remote track:', event.track.kind);
        const [stream] = event.streams;
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        setCallStatus('connected');
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 Sending ICE candidate');
          socket.emit('webrtc-signal', {
            roomId,
            signal: {
              type: 'ice-candidate',
              candidate: event.candidate
            }
          });
        }
      };

      // Monitor connection state
      pc.oniceconnectionstatechange = () => {
        console.log('🔌 ICE state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setCallStatus('connected');
        } else if (pc.iceConnectionState === 'failed') {
          setError('Connection failed');
          setCallStatus('failed');
        } else if (pc.iceConnectionState === 'disconnected') {
          setCallStatus('disconnected');
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('🔗 Connection state:', pc.connectionState);
      };

      // If initiator, create offer
      if (isInitiator) {
        console.log('📤 Creating offer...');
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: callType === 'video'
        });
        await pc.setLocalDescription(offer);
        
        socket.emit('webrtc-signal', {
          roomId,
          signal: { type: 'offer', sdp: offer.sdp }
        });
        console.log('✅ Offer sent');
      } else {
        console.log('⏳ Waiting for offer...');
      }

    } catch (err) {
      console.error('❌ Init error:', err);
      setError(err.message);
      setCallStatus('error');
      alert('Could not access camera/microphone. Error: ' + err.message);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream && callType === 'video') {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = () => {
    cleanup();
    socket.emit('end-call', { callId, roomId });
    onEndCall();
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped track:', track.kind);
      });
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      console.log('🔌 Closed peer connection');
    }
    setLocalStream(null);
    setRemoteStream(null);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-zinc-900/95 backdrop-blur-sm p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold">{otherUserName}</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                callStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                callStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                'bg-red-500'
              }`}></div>
              <p className="text-xs text-zinc-400 capitalize">{callStatus}</p>
            </div>
          </div>
        </div>
        <div className="text-zinc-400 text-sm">
          {callType === 'video' ? '📹 Video Call' : '🎤 Voice Call'}
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-zinc-900">
        {/* Remote Video (Full Screen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl text-white font-bold">
                  {otherUserName[0].toUpperCase()}
                </span>
              </div>
              <p className="text-white text-xl font-semibold">{otherUserName}</p>
              <p className="text-zinc-400 mt-2 capitalize">{callStatus}...</p>
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>
          </div>
        )}

        {/* Local Video (Picture in Picture) */}
        {callType === 'video' && (
          <div className="absolute top-4 right-4 w-48 h-36 bg-zinc-800 rounded-xl overflow-hidden border-2 border-zinc-700 shadow-2xl">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
            {isVideoOff && (
              <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-zinc-700 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">Camera Off</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-zinc-900/95 backdrop-blur-sm p-6">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all ${
              isMuted
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-zinc-700 hover:bg-zinc-600'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMuted ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              )}
            </svg>
          </button>

          {callType === 'video' && (
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all ${
                isVideoOff
                  ? 'bg-red-600 hover:bg-red-500'
                  : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
              title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          )}

          <button
            onClick={endCall}
            className="p-5 rounded-full bg-red-600 hover:bg-red-500 transition-all shadow-lg"
            title="End call"
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default VideoCall;