// FIX: Removed self-referential import of GameState. This line was `import { GameState } from './types';` and was causing a declaration conflict.
export enum GameState {
  NotStarted = 'NOT_STARTED',
  InProgress = 'IN_PROGRESS',
  Finished = 'FINISHED',
}

export type SnakesAndLadders = Map<number, number>;

export type Theme = {
  primary: string;
  secondary: string;
  border: string;
  text: string;
  bg: string;
};

export type SnakeDetail = {
  start: number;
  end: number;
  colors: [string, string];
};