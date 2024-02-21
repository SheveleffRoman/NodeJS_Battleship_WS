import WebSocket, { WebSocketServer } from "ws";
import dotenv from "dotenv";
import { handleClientRequest } from "../handlers/clientRequestHandler.js";

dotenv.config();

const ws_port = Number(process.env.WS_PORT) || 3000;

export const wsServer = new WebSocketServer({
  port: ws_port,
});

wsServer.on("connection", (ws: WebSocket) => {
  console.log("Connected with WebSocket");
  ws.on("message", (message: WebSocket.RawData) => {
    handleClientRequest(message, ws);
  });
});
