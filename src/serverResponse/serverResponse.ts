import WebSocket from "ws";
import {
  ClientRequest,
  Player,
  RegResponseData,
  Room,
  ServerResponse,
  User,
} from "../interfaces.js";
import { DB } from "../database/db.js";

export const serverRegUserResponse = (
  message: ClientRequest,
  ws: WebSocket
) => {
  try {
    const data = message.data;
    const parsedData = JSON.parse(data) as User;

    // Проверка уникальности имени игрока

    const playerExists = DB.findUserByName(parsedData.name);

    if (!playerExists) {
      // Добавление нового игрока в базу данных
      const newUser: User = {
        name: parsedData.name,
        password: parsedData.password,
      };

      const user = DB.registerUser(newUser); // push to db
      DB.addSocketToPlayer(user.index, ws); // push to socket

      const responseData: RegResponseData = {
        name: user.name,
        index: user.index,
        error: false,
        errorText: "",
      };

      // Отправка ответа клиенту
      const response: ServerResponse = {
        type: "reg",
        data: JSON.stringify(responseData),
        id: 0,
      };

      ws.send(JSON.stringify(response));
    } else {
      // Если имя игрока уже занято

      const responseData: RegResponseData = {
        name: parsedData.name,
        index: 0,
        error: true,
        errorText: "Name is already taken",
      };

      const response: ServerResponse = {
        type: "reg",
        data: JSON.stringify(responseData),
        id: 0,
      };

      ws.send(JSON.stringify(response));
    }
  } catch (error) {
    console.error("Error processing message:", error);
  }
};

export const serverCreateNewRoomResponse = (
  _message: ClientRequest,
  ws: WebSocket
) => {
  try {
    const rooms = DB.getRooms();
    const roomId = rooms.length == 0 ? 1 : rooms.length + 1;
    const player = DB.getPlayersList();
    const playerIndex = player[0].index;
    DB.createRoom();

    DB.addUserToRoom(playerIndex, roomId);
  } catch (error) {
    console.log(error);
  }
};

export const updateWinners = (ws: WebSocket) => {
  try {
    const winnersList = DB.getWinnersList();
    const response: ServerResponse = {
      type: "update_winners",
      data: JSON.stringify(winnersList),
      id: 0,
    };
    ws.send(JSON.stringify(response));
  } catch (error) {
    console.log(error);
  }
};

export const updateRoom = (ws: WebSocket) => {
  try {
    const roomsList = DB.getRooms();
    const response: ServerResponse = {
      type: "update_room",
      data: JSON.stringify(roomsList),
      id: 0,
    };
    ws.send(JSON.stringify(response));
  } catch (error) {
    console.log(error);
  }
};

export const addUserToRoom = (_ws: WebSocket) => {
  try {
    DB.addUserToRoom(2, 1);
    const rooms = DB.getRooms();
    const roomsL = rooms[0].roomUsers.length;
    if (roomsL > 1) {
      rooms[0].roomUsers.forEach((user) => {
        const index = user.index;
        const socket = DB.getPlayerSocket(index!);
        const response: ServerResponse = {
          type: "create_game",
          data: JSON.stringify({ idGame: 1, idPlayer: index }),
          id: 0,
        };

        socket?.send(JSON.stringify(response));
      });
    }
  } catch (error) {
    console.log(error);
  }
};
