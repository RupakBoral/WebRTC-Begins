import { useRef, useEffect, useState } from 'react';
import './App.css';
import Signaling from './services/signaling';
import WebRTCService from './services/webrtc';

function App() {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const signaling = new Signaling();
    const webRTCService = new WebRTCService(signaling.ws);

    signaling.setWebRTC(webRTCService);
    
    webRTCService.onLocalStream = (stream: MediaStream) => {
      setLocalStream(stream);
    }

    webRTCService.onRemoteStream = (stream: MediaStream) => {
      setRemoteStream(stream);
    }

    const init = async () => {
      await webRTCService.handleStream();
    }
    init();
  }, []);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream])

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream])

  return (
    <>
      <h1>WebRTC Begins</h1>
      <video
        ref={localVideoRef}
        autoPlay={true}
        playsInline
        muted={false}
        width={250}
      ></video>
      <video
        ref={remoteVideoRef}
        autoPlay={true}
        playsInline
        muted={false}
        width={250}
      ></video>
    </>
  )
}

export default App;