import { WebSocketServer } from 'ws';

const wsPort = 3000;

export const wsServer = new WebSocketServer({
  port: wsPort,
});

wsServer.on('connection', () => {
  console.log('Connected with WebSocket');
});