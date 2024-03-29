import WebSocket from "ws";
import {
  AddRoomResponse,
  Attack,
  ClientRequest,
  ExtendedWebSocket,
  GameRoom,
  RegResponseData,
  Room,
  ServerResponse,
  Ship,
  ShipCoordinate,
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

    const playerExists = DB.findUserByName(parsedData.name);

    if (!playerExists) {
      const newUser: User = {
        name: parsedData.name,
        password: parsedData.password,
      };

      const user = DB.registerUser(newUser, ws.clientId!);
      DB.addSocketToPlayer(user.index, ws);

      const responseData: RegResponseData = {
        name: user.name,
        index: user.index,
        error: false,
        errorText: "",
      };

      const response: ServerResponse = {
        type: "reg",
        data: JSON.stringify(responseData),
        id: 0,
      };

      ws.send(JSON.stringify(response));
    } else {

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

export const updateWinners = (
  ws: ExtendedWebSocket,
  winner?: Partial<Attack>
) => {
  try {
    let winnersList = DB.getWinnersList();
    if (winner) {
      const player = DB.getUserById(ws.clientId!);
      const playerIndex = winnersList.findIndex(
        (item) => item.name === player!.name
      );
      if (playerIndex !== -1) {
        winnersList[playerIndex].wins += 1;
      } else {
        winnersList = DB.addWinnersToList({ name: player!.name, wins: 1 });
      }
    }
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

    if (room.roomUsers.some((user) => user.index === clientId)) {
      console.log("User is already in the room");
      return;
    }

    if (room.roomUsers.length < 2) {
      DB.addUserToRoom(clientId, index);
    }

    if (room.roomUsers.length > 1) {
      DB.removeRoomById(index);
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

export const addShips = (message: ClientRequest) => {
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
          (acc: ShipCoordinate[], ship: Ship) => {
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

export function handleAttackRequest(message: ClientRequest) {
  let attackData: Attack;
  const usedCoordinates: { [key: string]: boolean } = {};
  const data = message.data.toString();
  let key: string;

  const checkRandomAttack = message.type.toString();
  if (checkRandomAttack === "randomAttack") {
    attackData = JSON.parse(data) as Attack;
    do {
      attackData.x = Math.floor(Math.random() * 10);
      attackData.y = Math.floor(Math.random() * 10);
      key = `${attackData.x},${attackData.y}`;
    } while (usedCoordinates[key]);

    usedCoordinates[key] = true;
  } else {
    attackData = JSON.parse(data) as Attack;
  }


  const shipPositions = DB.getShipsPosistions();

  const enemyPositions = shipPositions.find(
    (ships) => ships.indexPlayer != attackData.indexPlayer
  );

  if (enemyPositions) {
    attack(attackData, enemyPositions);
  }
}

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

let currentPlayerIndex = 0;

function attack(attack: Partial<Attack>, positions: ShipPositions) {
  const hitCoordinate = positions.shipsCoordinates.find(
    (coord) => coord.x === attack.x && coord.y === attack.y
  );

  const gameRoom = DB.getGameRoom();

  if (attack.indexPlayer != gameRoom[currentPlayerIndex].indexPlayer) {
    console.log("Not your turn");
    return;
  }


  if (hitCoordinate) {
    DB.removeCoordinateFromArray(attack);
  } else {
    switchTurn();
  }

  if (positions.shipsCoordinates.length == 0) {
    gameRoom.forEach((game: GameRoom) => {
      const playerIndex = game.indexPlayer;
      const socket = DB.getPlayerSocket(playerIndex);
      const finishResponse = {
        type: "finish",
        data: JSON.stringify({
          winPlayer: attack.indexPlayer,
        }),
        id: 0,
      };
      socket?.send(JSON.stringify(finishResponse));

      updateWinners(socket!, attack);
    });
  }

  gameRoom.forEach((game: GameRoom) => {
    const playerIndex = game.indexPlayer;
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
          currentPlayer: gameRoom[currentPlayerIndex].indexPlayer,
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
          currentPlayer: gameRoom[currentPlayerIndex].indexPlayer,
        }),
        id: 0,
      };

      socket?.send(JSON.stringify(turnResponse));
    }
  });

  function switchTurn() {
    currentPlayerIndex = 1 - currentPlayerIndex;
  }
}
