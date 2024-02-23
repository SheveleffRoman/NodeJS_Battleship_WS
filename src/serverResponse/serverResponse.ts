import WebSocket from "ws";
import {
  AddRoomResponse,
  ClientRequest,
  ExtendedWebSocket,
  GameRoom,
  Player,
  RegResponseData,
  Room,
  ServerResponse,
  User,
} from "../interfaces.js";
import { DB } from "../database/db.js";

export const serverRegUserResponse = (
  message: ClientRequest,
  ws: ExtendedWebSocket
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

      const user = DB.registerUser(newUser, ws.clientId!); // push to db
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
  ws: ExtendedWebSocket
) => {
  try {
    const rooms = DB.getRooms();
    const roomId = rooms.length == 0 ? 1 : rooms.length + 1;
    const player = DB.getUserById(ws.clientId!);
    const playerIndex = player?.index;

    DB.createRoom();
    DB.addUserToRoom(playerIndex!, roomId);
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

export const addUserToRoom = (
  message: ClientRequest,
  ws: ExtendedWebSocket
) => {
  try {
    const data = message.data.toString();
    const parsedData = JSON.parse(data) as AddRoomResponse;
    const index = parsedData.indexRoom;

    const clientId = ws.clientId!;

    const room = DB.getRoomById(index) as Room;

    // Check if the user is already in the room
    if (room.roomUsers.some((user) => user.index === clientId)) {
      console.log("User is already in the room");
      return;
    }

    if (room.roomUsers.length < 2) {
      DB.addUserToRoom(clientId, index);
    }

    if (room.roomUsers.length > 1) {
      room.roomUsers.forEach((user) => {
        const userIndex = user.index;
        const socket = DB.getPlayerSocket(userIndex!);

        const response: ServerResponse = {
          type: "create_game",
          data: JSON.stringify({ idGame: 1, idPlayer: userIndex }),
          id: 0,
        };

        socket?.send(JSON.stringify(response));
      });
    }
  } catch (error) {
    console.log(error);
  }
};

export const addShips = (message: ClientRequest, _ws: ExtendedWebSocket) => {
  try {
    const data = message.data.toString();
    const parsedData = JSON.parse(data);
    console.log(parsedData);
    DB.addShipsToRoom(parsedData);
    const gameRoom = DB.getGameRoom();
    if (gameRoom.length > 1) {
      gameRoom.forEach((game: GameRoom) => {
        const playerIndex = game.indexPlayer;
        const socket = DB.getPlayerSocket(playerIndex);

        const response: ServerResponse = {
          type: "start_game",
          data: JSON.stringify({
            ships: game.ships,
            currentPlayerIndex: game.indexPlayer,
          }),
          id: 0,
        };

        socket?.send(JSON.stringify(response));

        const randomPlayerIndex = Math.floor(Math.random() * 2);
        const turnResponse: ServerResponse = {
          type: "turn",
          data: JSON.stringify({
            currentPlayer: gameRoom[randomPlayerIndex].indexPlayer,
          }),
          id: 0,
        };

        socket?.send(JSON.stringify(turnResponse));
      });
    }
  } catch (error) {
    console.log(error);
  }
};
