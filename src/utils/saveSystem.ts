import { PlayerShip } from '@/types/galaxy';
import { MissionLog } from '@/types/missions';
import { ShipComponents } from '@/types/ship';

export interface GameState {
  player: PlayerShip;
  components: ShipComponents;
  missionLog: MissionLog;
  playerReputation: number;
  health: number;
  fuel: number;
  lastSaved: string;
}

const SAVE_KEY = 'galactic_trader_save';

export const saveGame = (gameState: GameState): void => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      ...gameState,
      lastSaved: new Date().toISOString()
    }));
    console.log('Game saved successfully');
  } catch (error) {
    console.error('Failed to save game:', error);
    throw new Error('Failed to save game');
  }
};

export const loadGame = (): GameState | null => {
  try {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (!savedData) return null;
    
    const gameState = JSON.parse(savedData) as GameState;
    console.log('Game loaded successfully');
    return gameState;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
};

export const deleteSave = (): void => {
  try {
    localStorage.removeItem(SAVE_KEY);
    console.log('Save file deleted successfully');
  } catch (error) {
    console.error('Failed to delete save:', error);
    throw new Error('Failed to delete save');
  }
};

export const hasSaveFile = (): boolean => {
  return localStorage.getItem(SAVE_KEY) !== null;
}; 