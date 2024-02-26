import WebSocket, { WebSocketServer } from "ws";
import dotenv from "dotenv";
import { handleClientRequest } from "../handlers/clientRequestHandler.js";
import { ExtendedWebSocket } from "../interfaces.js";
import { generateRandomId } from "../utils/randomID.js";
import { DB } from "../database/db.js";

dotenv.config();

const ws_port = Number(process.env.WS_PORT) || 3000;

export const wsServer = new WebSocketServer({
  port: ws_port,
});

wsServer.on("connection", (ws: ExtendedWebSocket) => {
  const clientId = generateRandomId();
  console.log(`WebSocket connected with ID: ${clientId}`);
  ws.clientId = clientId;

  ws.on("message", (message: WebSocket.RawData) => {
    handleClientRequest(message, ws);
  });

  ws.on("close", () => {
    const clientId = ws.clientId;
    DB.removeSocketById(clientId!);
    console.log(`WebSocket disconnected: ${clientId}`);
  });
});
