import { WebSocket, WebSocketServer } from 'ws';
const wss: WebSocketServer = new WebSocketServer({ port: 8000 });

const queue = new Array<WebSocket>();
let connections = new Map<WebSocket, WebSocket>();

wss.on("connection", (ws: WebSocket) => {

    ws.on("message", (event) => {
        const data = JSON.parse(event.toString());

        if (data.type === 'join') {
            console.log(`Client joined the room`);
            if (queue.length === 0) {
                queue.push(ws);
                console.log("Added to queue");
            } else {
                const client = queue.pop();
                if (client) {
                    connections.set(ws, client);
                    connections.set(client, ws);
                    console.log("Removed from queue");
                }
            }
            return;
        }

        const partner = connections.get(ws);
        if (partner && partner !== ws) {
            partner.send(JSON.stringify(data));
        }

    })
    ws.on('close', () => {
        console.log("Client disconnected");
    });
});

console.log("Server running in port: 8000");