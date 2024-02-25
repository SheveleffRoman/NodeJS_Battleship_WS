import WebSocket from "ws";
import {
  AddRoomResponse,
  Attack,
  ClientRequest,
  ExtendedWebSocket,
  GameRoom,
  Player,
  RegResponseData,
  Room,
  ServerResponse,
  Ship,
  ShipPosition,
  ShipPositions,
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

        const allShipCoordinates = game.ships.reduce(
          (acc: ShipPosition[], ship: Ship) => {
            const shipCoordinates = getShipCoordinates(ship);
            return acc.concat(shipCoordinates);
          },
          []
        );

        DB.addShipsPositions({
          indexPlayer: playerIndex,
          shipsCoordinates: allShipCoordinates,
        });

        socket?.send(JSON.stringify(response));

        const turnResponse: ServerResponse = {
          type: "turn",
          data: JSON.stringify({
            currentPlayer: gameRoom[0].indexPlayer,
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

// Оработка запроса атаки
export function handleAttackRequest(
  message: ClientRequest,
  ws: ExtendedWebSocket
) {
  const data = message.data.toString();
  const attackData = JSON.parse(data) as Attack;
  console.log(attackData);

  // // Найти корабли соперника по indexPlayer

  const shipPositions = DB.getShipsPosistions();
  // console.log(shipPositions);

  const enemyPositions = shipPositions.find(
    (ships) => ships.indexPlayer != attackData.indexPlayer
  );
  // console.log(enemyPositions);

  if (enemyPositions) {
    const attackStatus = attack(attackData, enemyPositions);
  }

  // console.log(game?.ships);

  // if (game) {
  // Проверить, было ли попадание
  // console.log(game)
  // const hitShip = game.ships.find(
  //   (ship) =>
  //     ship.position.x === attackData.x && ship.position.y === attackData.y
  // );

  // const shipPositions = game.ships;
  // console.log(shipPositions);

  // Получение всех координат кораблей
  // const allShipCoordinates = shipPositions.reduce((acc, ship) => {
  //   const shipCoordinates = getShipCoordinates(ship);
  //   return acc.concat(shipCoordinates);
  // }, []);

  // console.log(allShipCoordinates);

  // console.log(hitShip);

  // Отправить ответ клиенту
  // const response = {
  //   type: "attack",
  //   data: JSON.stringify({
  //     gameId: attackData.gameId,
  //     position: { x: attackData.x, y: attackData.y },
  //     currentPlayer: attackData.indexPlayer,
  //     status: hitShip != undefined ? "shot" : "miss", // Указать результат атаки
  //   }),
  //   id: 0,
  // };

  // gameRoom.forEach((game: GameRoom) => {
  //   const playerIndex = game.indexPlayer;
  //   const socket = DB.getPlayerSocket(playerIndex);

  //   socket?.send(JSON.stringify(response));
  // });
}
// }

function getShipCoordinates(ship: Ship) {
  const coordinates = [];
  let { x, y } = ship.position;

  for (let i = 0; i < ship.length; i++) {
    coordinates.push({ x, y });
    if (ship.direction) {
      y++;
    } else {
      x++;
    }
  }

  return coordinates;
}

// Функция для удаления координаты из массива
function removeCoordinateFromArray(
  array: ShipPosition[],
  coordinate: Partial<Attack>
) {
  return array.filter(
    (coord) => coord.x !== coordinate.x || coord.y !== coordinate.y
  );
}

// Функция для атаки по координатам
function attack(attack: Partial<Attack>, positions: ShipPositions) {
  console.log(positions.shipsCoordinates);
  const hitCoordinate = positions.shipsCoordinates.find(
    (coord) => coord.x === attack.x && coord.y === attack.y
  );

  console.log(hitCoordinate);

  // if (hitCoordinate) {
  //   console.log("Попадание!");

  const gameRoom = DB.getGameRoom();
  gameRoom.forEach((game: GameRoom) => {
    const playerIndex = game.indexPlayer; // порядковый номер в группе
    // let currentPlayerIndex = gameRoom[0].indexPlayer;
    // let nextPlayerIndex = gameRoom[1].indexPlayer;
    // function switchTurn() {
    //   const temp = currentPlayerIndex;
    //   currentPlayerIndex = nextPlayerIndex;
    //   nextPlayerIndex = temp;
    // }
    if (hitCoordinate) {
      const response = {
        type: "attack",
        data: JSON.stringify({
          position: { x: hitCoordinate.x, y: hitCoordinate.y },
          currentPlayer: attack.indexPlayer,
          status: "shot",
        }),
        id: 0,
      };
      const socket = DB.getPlayerSocket(playerIndex);
      socket?.send(JSON.stringify(response));

      const turnResponse: ServerResponse = {
        type: "turn",
        data: JSON.stringify({
          currentPlayer: gameRoom[0].indexPlayer,
        }),
        id: 0,
      };

      socket?.send(JSON.stringify(turnResponse));
    } else {
      const response = {
        type: "attack",
        data: JSON.stringify({
          position: { x: attack.x, y: attack.y },
          currentPlayer: attack.indexPlayer,
          status: "miss",
        }),
        id: 0,
      };
      const socket = DB.getPlayerSocket(playerIndex);
      socket?.send(JSON.stringify(response));

      const turnResponse: ServerResponse = {
        type: "turn",
        data: JSON.stringify({
          currentPlayer: gameRoom[1].indexPlayer,
        }),
        id: 0,
      };

      socket?.send(JSON.stringify(turnResponse));
    }
  });

  // removeCoordinateFromArray(positions, coordinates);
  // } else {
  //   console.log("Мимо!");
  // }
}

