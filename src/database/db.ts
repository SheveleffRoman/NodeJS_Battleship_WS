import WebSocket from "ws";
import {
  Attack,
  GameRoom,
  Player,
  Room,
  ShipPositions,
  User,
  Winner,
} from "../interfaces.js";

class DataBase {
  private playersList: Player[] = [];
  private rooms: Room[] = [];
  private winnersList: Winner[] = [];
  private playerSockets: Map<number, WebSocket> = new Map();
  private gameRoom: GameRoom[] = [];
  private shipPositions: ShipPositions[] = [];

  // Добавление сокета к игроку
  addSocketToPlayer(index: number, socket: WebSocket): void {
    this.playerSockets.set(index, socket);
  }

  // Получение сокета игрока по индексу
  getPlayerSocket(index: number): WebSocket | undefined {
    return this.playerSockets.get(index);
  }

  removeSocketById(index: number) {
    return this.playerSockets.delete(index);
  }

  getAllSockets() {
    return this.playerSockets;
  }

  // Регистрация нового пользователя
  registerUser(user: User, index: number): Player {
    const newUser = { name: user.name, password: user.password, index };
    this.playersList.push(newUser);
    return newUser;
  }

  // Поиск пользователя по имени
  findUserByName(name: string): Player | undefined {
    return this.playersList.find((user) => user.name === name);
  }

  getUserById(id: number): Player | undefined {
    return this.playersList.find((player) => player.index === id);
  }

  getPlayersList(): Player[] {
    return this.playersList;
  }

  createRoom() {
    const roomId = this.rooms.length + 1;
    const newRoom = { roomId: roomId, roomUsers: [] };
    return this.rooms.push(newRoom);
  }

  getRooms(): Room[] {
    return this.rooms;
  }

  clearRooms(id: number): Room[] {
    return (this.rooms = []);
  }

  removeRoomById(id: number): void {
    const indexToRemove = this.rooms.findIndex((room) => room.roomId === id);

    if (indexToRemove !== -1) {
      this.rooms.splice(indexToRemove, 1);
      console.log(`Room with id ${id} has been removed.`);
    } else {
      console.log(`Room with id ${id} not found.`);
    }
  }

  addUserToRoom(index: number, roomId: number): void {
    const player = this.getUserById(index);
    const room = this.rooms.find((r) => r.roomId === roomId);

    if (player && room) {
      const { name, index } = player;
      const roomPlayer: Partial<Player> = { name, index };
      room.roomUsers.push(roomPlayer);
    }
  }

  getRoomById(index: number): Room | undefined {
    return this.rooms.find((r) => r.roomId === index);
  }

  getWinnersList(): Winner[] {
    return this.winnersList;
  }

  addWinnersToList(winner: Winner): Winner[] {
    this.winnersList.push(winner);
    return this.winnersList;
  }

  addShipsToRoom(ships: GameRoom) {
    return this.gameRoom.push(ships);
  }

  getGameRoom(): GameRoom[] {
    return this.gameRoom;
  }

  addShipsPositions(positions: ShipPositions) {
    return this.shipPositions.push(positions);
  }

  getShipsPosistions(): ShipPositions[] {
    return this.shipPositions;
  }

  removeCoordinateFromArray(attack: Partial<Attack>) {
    const enemyPositionsIndex = this.shipPositions.findIndex(
      (ships) => ships.indexPlayer !== attack.indexPlayer
    );

    if (enemyPositionsIndex !== -1) {
      const enemyPositions = this.shipPositions[enemyPositionsIndex];

      const updatedCoordinates = enemyPositions.shipsCoordinates.filter(
        (coord) => coord.x !== attack.x || coord.y !== attack.y
      );

      // Обновляем shipPositions соперника
      this.shipPositions[enemyPositionsIndex].shipsCoordinates =
        updatedCoordinates;

      console.log("Updated enemy positions:", this.shipPositions);
    } else {
      console.error("Enemy positions not found.");
    }
  }
}

export const DB = new DataBase();

//   addUserToRoom(user: Partial<Player>) {
//     const roomId = this.rooms.length + 1;
//     const newUser = { index: user.index, name: user.name };
//     const newRoom = { roomId: roomId, roomPlayers: newUser };
//     return this.rooms.push(newRoom);
//   }
