import type { Payload } from "../types/interface";
import { getAnswerPayload, getRoomPayload } from "../utils/getPayload";
import type WebRTCService from "./webrtc";

class Signaling {
  public ws: WebSocket;
  private webRTCService: WebRTCService | undefined;

  constructor() {
    this.ws = new WebSocket("wss://b192-106-222-226-82.ngrok-free.app");

    // Open WebSocket connection to the Signaling Server
    this.ws.onopen = () => {
      const data: Payload = getRoomPayload();
      this.ws.send(JSON.stringify(data));
      console.log("Sent Room ID");
    }

    // Handle different events from remote peer
    this.ws.onmessage = async (msg) => {
      const data = JSON.parse(msg.data);
      const event: string = data?.type;

      if (!this.webRTCService) {
        console.log("No one connected");
        return;
      }

      switch (event) {
        case "ice":
          await this.webRTCService.addIceCandidate(data.candidate);
          break;

        case "offer":
          await this.webRTCService.setRemoteDescription(data.sdp);

          const answer: RTCSessionDescriptionInit = await this.webRTCService.createAnswer();
          await this.webRTCService.setLocalDescription(answer);

          const payload: Payload = getAnswerPayload(answer);

          this.ws.send(JSON.stringify(payload));
          break;

        case "answer":
          await this.webRTCService.setRemoteDescription(data.answer);
          break;

        default:
          console.log("Event is not supported");
      }
    }
  }

  public setWebRTC = (webRTCService: WebRTCService) => {
    this.webRTCService = webRTCService;
  }

}

export default Signaling;