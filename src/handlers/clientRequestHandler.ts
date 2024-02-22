import WebSocket from "ws";
import { isValidRequestObject } from "../utils/objectValidation.js";
import { ClientRequest } from "../interfaces.js";
import {
  addUserToRoom,
  serverCreateNewRoomResponse,
  serverRegUserResponse,
  updateRoom,
  updateWinners,
} from "../serverResponse/serverResponse.js";
import { DB } from "../database/db.js";

export const handleClientRequest = (
  message: WebSocket.RawData,
  ws: WebSocket
): void => {
  let clientMessageObj: unknown;
  const messageStr = message.toString();

  try {
    clientMessageObj = JSON.parse(messageStr);
  } catch {
    const failMessage = "Invalid request to Server";
    console.log(failMessage);
    return;
  }

  if (isValidRequestObject(clientMessageObj)) {
    handleRequest(clientMessageObj as ClientRequest, ws);
  }
};

const handleRequest = (message: ClientRequest, ws: WebSocket): void => {
  switch (message.type) {
    case "reg":
      serverRegUserResponse(message, ws);
      updateRoom(ws);
      updateWinners(ws);
      break;
    case "create_room":
      serverCreateNewRoomResponse(message, ws);
      updateRoom(ws);

    case "add_user_to_room":
      addUserToRoom(ws);
      updateRoom(ws);

    default:
      break;
  }
};
