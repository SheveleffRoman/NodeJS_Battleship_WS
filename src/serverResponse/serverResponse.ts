import WebSocket from "ws";
import {
  ClientRequest,
  Player,
  RegResponseData,
  ServerResponse,
  User,
} from "../interfaces.js";
import { players } from "../database/db.js";

export const serverRegUserResponse = (
  message: ClientRequest,
  ws: WebSocket
) => {
  try {
    const data = message.data;
    const parsedData = JSON.parse(data) as User;
    console.log(parsedData);

    // Проверка уникальности имени игрока
    const playerExists = players.some(
      (player: User) => player.name === parsedData.name
    );

    if (!playerExists) {
      // Добавление нового игрока в базу данных
      const newUser: Player = {
        name: parsedData.name,
        index: players.length + 1, // Просто увеличиваем индекс
        password: parsedData.password,
      };

      players.push(newUser); // push to db

      const responseData: RegResponseData = {
        name: newUser.name,
        index: newUser.index,
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
