import type { Payload } from "../types/interface";
import config from "../utils/config";
import { getIcePayload, getOfferPayload } from "../utils/getPayload";

class WebRTCService {
    private peerConn: RTCPeerConnection;
    private ws: WebSocket;

    constructor(ws: WebSocket) {
        this.ws = ws;
        this.peerConn = this.createPeerConn();
        this.registerEvents();
    }

    // RTC Connection object
    private createPeerConn = (): RTCPeerConnection => {
        return new RTCPeerConnection(config);
    }

    // Register Peer connection events
    private registerEvents = () => {
        // ICE Candidate handling
        this.peerConn.onicecandidate = (event) => {
            if (event.candidate !== null) {
                const data = getIcePayload(event.candidate);
                this.ws.send(JSON.stringify(data));
            } else {
                console.log("No ICE candidate");
            }
        }

        // Handle Peer Data channel
        this.peerConn.ondatachannel = (event) => {
            const receiverDataChannel = event.channel;

            receiverDataChannel.onopen = () => {
                console.log("");
            }
        }

        // handle Remote audio/ video flow
        this.peerConn.ontrack = (event) => {
            const remoteStream = new MediaStream();
            remoteStream.addTrack(event.track);
            if (this.onRemoteStream) {
                console.log("Remote stream");
                this.onRemoteStream(remoteStream);
            } else {
                console.log("Else")
            }
        }

        // monitor connection
        this.peerConn.onconnectionstatechange = () => {
            console.log(this.peerConn.connectionState);
        };

        this.peerConn.onnegotiationneeded = async () => {
            const offer = await this.createOffer();
            const data: Payload = getOfferPayload(offer);
            this.ws.send(JSON.stringify(data));
        }
    }

    // Create an offer
    private createOffer = async (): Promise<RTCSessionDescriptionInit> => {
        const offer = await this.peerConn.createOffer();
        await this.peerConn.setLocalDescription(offer);
        return offer;
    }

    // Add remote ICE candidate
    public addIceCandidate = async (candidate: RTCIceCandidateInit) => {
        await this.peerConn.addIceCandidate(candidate);
    }

    // Offer SDP to remote peer
    public setRemoteDescription = async (sdp: RTCSessionDescriptionInit) => {
        await this.peerConn.setRemoteDescription(
            new RTCSessionDescription(sdp)
        );
    }

    // Create a SDP to answer the remote peer
    public createAnswer = async (): Promise<RTCSessionDescriptionInit> => {
        return await this.peerConn.createAnswer();
    }

    // Set the local description as the answer
    public setLocalDescription = async (answer: RTCSessionDescriptionInit) => {
        await this.peerConn.setLocalDescription(
            new RTCSessionDescription(answer)
        );
    }

    // Create Data channel to send and receive arbitrary data
    public dataChannel = async () => {
        const dataChannel = this.peerConn.createDataChannel("data_flow");

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

    public handleStream = async () => {
        const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStream.getTracks().forEach((track) => {
            this.peerConn.addTrack(track, localStream);
            if (this.onLocalStream) {
                this.onLocalStream(localStream);
            }
        });
    }

    public onRemoteStream?: (remoteStream: MediaStream) => void;

    public onLocalStream?: (localStream: MediaStream) => void;
}

export default WebRTCService;