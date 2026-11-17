// Backend DTO'larının (TrustNobody.Application) TypeScript karşılıkları.

export type GamePhase = "Lobby" | "Night" | "Day" | "Voting" | "Ended";
export type Role = "None" | "Villager" | "Vampire" | "Doctor" | "Seer";
export type Team = "None" | "Villagers" | "Vampires";
export type ActionType = "VampireBite" | "DoctorProtect" | "SeerInspect" | "Vote" | "ReadyToVote";

export interface User {
  id: string;
  /** Misafirlerde null. */
  email: string | null;
  username: string;
  /** Kayıt olmadan, sadece takma adla giren kullanıcı. */
  isGuest: boolean;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface GameSettings {
  maxPlayers: number;
  vampireCount: number;
  doctorEnabled: boolean;
  seerEnabled: boolean;
  nightSeconds: number;
  discussionSeconds: number;
  votingSeconds: number;
  revealRoleOnDeath: boolean;
}

export interface MyGame {
  code: string;
  phase: GamePhase;
  round: number;
  ownerUsername: string;
  playerCount: number;
  maxPlayers: number;
  isOwner: boolean;
  createdAt: string;
}

export interface PlayerView {
  id: string;
  username: string;
  seat: number;
  isAlive: boolean;
  isOwner: boolean;
  isMe: boolean;
  role: Role | null;
  deathCause: string | null;
  hasVoted: boolean | null;
  isReady: boolean | null;
}

export interface ActionView {
  type: ActionType;
  prompt: string;
  targets: string[];
  canSkip: boolean;
  hasActed: boolean;
  currentTargetId: string | null;
  locked: boolean;
}

export interface ReadyView {
  count: number;
  needed: number;
  iAmReady: boolean;
}

export interface EventView {
  id: number;
  round: number;
  phase: GamePhase;
  message: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface GameView {
  code: string;
  phase: GamePhase;
  round: number;
  phaseEndsAt: string | null;
  serverNow: string;
  winner: Team;
  settings: GameSettings;
  isOwner: boolean;
  myPlayerId: string;
  myRole: Role;
  myAlive: boolean;
  players: PlayerView[];
  action: ActionView | null;
  ready: ReadyView | null;
  secretInfo: string[];
  events: EventView[];
}

export const MIN_PLAYERS = 4;

export const DEFAULT_SETTINGS: GameSettings = {
  maxPlayers: 10,
  vampireCount: 2,
  doctorEnabled: true,
  seerEnabled: true,
  nightSeconds: 60,
  discussionSeconds: 300,
  votingSeconds: 60,
  revealRoleOnDeath: true,
};
