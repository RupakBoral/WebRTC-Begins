import { useRef, useEffect } from 'react';
import './App.css';

// RTC Connection object
const createPeerConn = () => {
  const config: RTCConfiguration  = {
    iceServers: [
      {
        urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
      },
    ],
    iceCandidatePoolSize: 10,
  };
  const peerConn = new RTCPeerConnection(config);
  return peerConn;
}

// Initialize Connection
const initConn = async (peerConn: RTCPeerConnection, ws: WebSocket, localVideoRef: React.RefObject<HTMLVideoElement | null>, remoteVideoRef: React.RefObject<HTMLVideoElement | null>) => {
  // Open WebSocket connection to the Signaling Server
    ws.onopen = () => {
      const data = {
        "type": "join-room",
        "roomId": 100
      }
      ws.send(JSON.stringify(data));
      console.log("Sent Room ID");
    }

    // ICE Candidate handling
    peerConn.onicecandidate = (event) => {
      if(event.candidate !== null) {
        const data = {
          "type": "ice",
          "candidate": event.candidate
        }
        ws.send(JSON.stringify(data));
      } else {
        console.log("No ICE candidate");
      }
    }

    // Handle Peer Data channel
    peerConn.ondatachannel = (event) => {
      const receiverDataChannel = event.channel;

      receiverDataChannel.onopen = () => {
        console.log("");
      }
    }

    // handle Remote audio/ video flow
    peerConn.ontrack = (event) => {
      const mediaStream = event.streams[0];
      const video = remoteVideoRef.current;

      if (video && video.srcObject !== mediaStream) {
        video.srcObject = mediaStream;
      }
    }

    // Handle different events from remote peer
    ws.onmessage = async (msg) => {
      const data = JSON.parse(msg.data);
      const event = data?.type;
      const candidate = data?.candidate;
      const sdp = data?.sdp;

      if(event === "ice") {
        await peerConn.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } else if(event === "offer") {
        await peerConn.setRemoteDescription(sdp);
        const answer = await peerConn.createAnswer();
        await peerConn.setLocalDescription(answer);
        const data = {
          "type": "answer",
          "sdp": answer
        }
        ws.send(JSON.stringify(data));
      } else if(event === "answer") {
        await peerConn.setRemoteDescription(
          new RTCSessionDescription(sdp)
        );
      }
    }

    // monitor connection
    peerConn.onconnectionstatechange = () => {
      console.log(peerConn.connectionState);
    };

  await addLocalMedia(peerConn, localVideoRef);
  await handleDataChannel(peerConn);
  await createOffer(peerConn, ws);
}

// Handle data flow through channel
const handleDataChannel = async (peerConn: RTCPeerConnection) => {
  const dataChannel = await createDataChannel(peerConn);

  dataChannel.onopen = () => {
    console.log("Remote peer connected to share data");
    dataChannel.send("Hello from the data channel");
  }

  dataChannel.onmessage = (event) => {
    console.log("Message from remote peer1: ", event.data);
  }

  dataChannel.onclose = () => {
    console.log("Connection closed");
  }

}

// Config media and add to remote peer
const addLocalMedia = async (peerConn: RTCPeerConnection, localVideoRef: React.RefObject<HTMLVideoElement | null>) => {
  const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true});
  localStream.getTracks().forEach((track) => {
    peerConn.addTrack(track, localStream);
    
    const video = localVideoRef.current;

    if (video && video.srcObject !== localStream) {
      video.srcObject = localStream;
    }
  });
}

// Create Data channel
const createDataChannel = async (peerConn: RTCPeerConnection) => {
  const dataChannel =  peerConn.createDataChannel("data-flow");
  return dataChannel;
}

// Creating an offer
const createOffer = async (peerConn: RTCPeerConnection, ws: WebSocket) => {
  const offer = await peerConn.createOffer();
  await peerConn.setLocalDescription(offer);
  const data = {
    "type": "offer",
    "sdp": offer
  }
  ws.send(JSON.stringify(data));
}

function App() {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef  = useRef<HTMLVideoElement>(null);

  try{

    useEffect(() => {
      const peerConn = createPeerConn();
      const ws = new WebSocket("ws://localhost:8000");

      initConn(peerConn, ws, localVideoRef, remoteVideoRef); 

      return () => {
        peerConn.close();
        ws.close();
      };
    }, []);

  } catch(err) {
    console.log("Error: ", err);
  }

  return (
    <>
      <h1>WebRTC Begins</h1>
      <video
        ref={localVideoRef}
        autoPlay={true}
        playsInline
        muted={true}
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

export default App
