import WebSocket from "ws";
import { isValidRequestObject } from "../utils/objectValidation.js";
import { ClientRequest, ExtendedWebSocket } from "../interfaces.js";
import {
  addShips,
  addUserToRoom,
  handleAttackRequest,
  serverCreateNewRoomResponse,
  serverRegUserResponse,
  updateRoom,
  updateWinners,
} from "../serverResponse/serverResponse.js";

export const handleClientRequest = (
  message: WebSocket.RawData,
  ws: ExtendedWebSocket
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

const handleRequest = (message: ClientRequest, ws: ExtendedWebSocket): void => {
  switch (message.type) {
    case "reg":
      serverRegUserResponse(message, ws);
      updateRoom(ws);
      updateWinners(ws);
      break;
    case "create_room":
      serverCreateNewRoomResponse(message, ws);
      updateRoom(ws);
      break;

    case "add_user_to_room":
      addUserToRoom(message, ws);
      updateRoom(ws);
      break;

    case "add_ships":
      addShips(message);
      break;

    case "attack":
      handleAttackRequest(message);
      break;

    case "randomAttack":
      handleAttackRequest(message);

    default:
      break;
  }
};
