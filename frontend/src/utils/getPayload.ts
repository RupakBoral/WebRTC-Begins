import type { Payload } from "../types/interface"

export const getRoomPayload = (): Payload => {
    const payload: Payload = {
        "type": "join",
    }
    return payload;
}


export const getOfferPayload = (offer: RTCSessionDescriptionInit): Payload => {
    const payload: Payload = {
        "type": "offer",
        "sdp": offer
    }
    return payload;
}


export const getAnswerPayload = (answer: RTCSessionDescriptionInit): Payload => {
    const payload: Payload = {
        "type": "answer",
        "answer": answer
    }
    return payload;
}


export const getIcePayload = (candidate: RTCIceCandidate): Payload => {
    const payload: Payload = {
        "type": "ice",
        "candidate": candidate
    }
    return payload;
}