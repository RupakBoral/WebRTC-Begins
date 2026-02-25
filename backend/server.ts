import { WebSocket, WebSocketServer } from 'ws';
const wss: WebSocketServer = new WebSocketServer({ port: 8000 });

interface Client extends WebSocket {
    roomId: string;
}

wss.on("connection", (ws: Client) => {
    ws.on("message", (event)=> {
        const data = JSON.parse(event.toString());

        if(data.type === 'join-room') {
            ws.roomId = data.roomId;
            console.log(`Client joined the room: ${ws.roomId}`);
            return;
        }

        const clients = wss.clients;

        clients.forEach((client) => {
            const c = client as Client;
            if(
                c != ws && 
                c.roomId === ws.roomId && 
                c.readyState === WebSocket.OPEN
            ) {
                c.send(JSON.stringify(data));
            }
        });
    })
    ws.on('close', () => {
        console.log("Client disconnected");
    });
});

console.log("Server running in port: 8000");