import WebSocket from "ws";
import {
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

  clearRooms(): Room[] {
    return (this.rooms = []);
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
}

export const DB = new DataBase();

//   addUserToRoom(user: Partial<Player>) {
//     const roomId = this.rooms.length + 1;
//     const newUser = { index: user.index, name: user.name };
//     const newRoom = { roomId: roomId, roomPlayers: newUser };
//     return this.rooms.push(newRoom);
//   }
