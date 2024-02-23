import WebSocket from "ws";

export type ClientObjTypes =
  | "reg"
  | "update_winners"
  | "create_room"
  | "add_user_to_room"
  | "create_game"
  | "update_room"
  | "add_ships"
  | "attack"
  | "randomAttack"
  | "turn"
  | "finish"
  | "single_play";

export interface ClientRequest {
  type: ClientObjTypes;
  id: number;
  data: string;
}

export interface ServerResponse {
  type: ClientObjTypes;
  id: number;
  data: string;
}

export interface RegResponseData {
  name: string;
  index: number;
  error: boolean;
  errorText: string;
}

export interface User {
  name: string;
  password: string;
}

export interface Player extends User {
  index: number;
}

export interface Room {
  roomId: number;
  roomUsers: Partial<Player>[];
}

export interface AddRoomResponse {
  indexRoom: number;
}

export interface Winner {
  name: string;
  wins: number;
}

export interface ExtendedWebSocket extends WebSocket {
  clientId?: number;
}
