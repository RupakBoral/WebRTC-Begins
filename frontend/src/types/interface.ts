export interface Payload {
    type: string,
    roomId?: string,
    sdp?: RTCSessionDescriptionInit,
    answer?: RTCSessionDescriptionInit,
    candidate?: RTCIceCandidate
}