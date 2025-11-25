import { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  User
} from 'lucide-react';

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
      <div className="bg-zinc-900/95 backdrop-blur-sm p-4 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{otherUserName}</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${callStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                  callStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                    'bg-red-500'
                }`}></div>
              <p className="text-xs text-zinc-400 capitalize">{callStatus}</p>
            </div>
          </div>
        </div>
        <div className="text-zinc-400 text-sm flex items-center space-x-2 bg-zinc-800 px-3 py-1.5 rounded-full">
          {callType === 'video' ? <Video className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          <span>{callType === 'video' ? 'Video Call' : 'Voice Call'}</span>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-zinc-900 overflow-hidden">
        {/* Remote Video (Full Screen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full animate-ping"></div>
                <span className="text-4xl text-white font-bold">
                  {otherUserName[0]?.toUpperCase()}
                </span>
              </div>
              <p className="text-white text-xl font-semibold">{otherUserName}</p>
              <p className="text-zinc-400 mt-2 capitalize animate-pulse">{callStatus}...</p>
              {error && <p className="text-red-400 text-sm mt-2 bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>}
            </div>
          </div>
        )}

        {/* Local Video (Picture in Picture) */}
        {callType === 'video' && (
          <div className="absolute top-4 right-4 w-32 h-48 sm:w-48 sm:h-72 bg-zinc-800 rounded-2xl overflow-hidden border-2 border-zinc-700 shadow-2xl transition-all hover:scale-105">
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
                  <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center mx-auto">
                    <VideoOff className="w-6 h-6 text-zinc-400" />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-2">Camera Off</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-zinc-900/95 backdrop-blur-sm p-6 pb-8">
        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all transform hover:scale-110 ${isMuted
                ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {callType === 'video' && (
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all transform hover:scale-110 ${isVideoOff
                  ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
                }`}
              title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
          )}

          <button
            onClick={endCall}
            className="p-5 rounded-full bg-red-600 hover:bg-red-500 text-white transition-all transform hover:scale-110 shadow-lg shadow-red-600/30"
            title="End call"
          >
            <PhoneOff className="w-7 h-7" />
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