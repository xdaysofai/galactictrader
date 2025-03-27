import { ResourceTypeValues } from './galaxy';

export type MissionType = 'delivery' | 'smuggling' | 'bounty' | 'trade';
export type MissionStatus = 'available' | 'active' | 'completed' | 'failed';

export interface MissionObjective {
  type: 'deliver' | 'collect' | 'eliminate' | 'trade';
  resource?: ResourceTypeValues;
  amount?: number;
  targetLocation?: string;
  description: string;
}

export interface MissionReward {
  credits: number;
  reputation?: number;
  items?: {
    type: string;
    amount: number;
  }[];
}

export interface Mission {
  id: string;
  title: string;
  type: MissionType;
  description: string;
  giver: string;
  location: string;
  objectives: MissionObjective[];
  reward: MissionReward;
  status: MissionStatus;
  timeLimit?: number;
  riskLevel: 1 | 2 | 3;
  requiredReputation?: number;
  completionProgress: number;
  expiryTime?: number;
}

export interface MissionLog {
  activeMissions: Mission[];
  completedMissions: Mission[];
  failedMissions: Mission[];
}

export type EventType = 'pirates' | 'police' | 'traders';

export interface Enemy {
  name: string;
  type: EventType;
  power: number;
  shields: number;
  speed: number;
  credits: number;
}

export interface RandomEvent {
  type: EventType;
  enemy: Enemy;
  description: string;
}

export interface EventOutcome {
  success: boolean;
  damage: number;
  fuelCost: number;
  creditsCost: number;
  cargoLost?: {
    type: 'random' | ResourceTypeValues;
    amount: number;
  };
  message: string;
}

export interface CombatStats {
  attack: number;
  defense: number;
  escapeChance: number;
}

export const ENEMY_TYPES: Record<EventType, Enemy[]> = {
  pirates: [
    {
      name: 'Space Pirate Scout',
      type: 'pirates',
      power: 50,
      shields: 30,
      speed: 80,
      credits: 500,
    },
    {
      name: 'Pirate Raider',
      type: 'pirates',
      power: 80,
      shields: 60,
      speed: 70,
      credits: 1000,
    },
    {
      name: 'Pirate Warlord',
      type: 'pirates',
      power: 120,
      shields: 100,
      speed: 60,
      credits: 2000,
    },
  ],
  police: [
    {
      name: 'Police Patrol',
      type: 'police',
      power: 60,
      shields: 50,
      speed: 90,
      credits: 0,
    },
    {
      name: 'Police Interceptor',
      type: 'police',
      power: 90,
      shields: 80,
      speed: 100,
      credits: 0,
    },
    {
      name: 'Police Battlecruiser',
      type: 'police',
      power: 150,
      shields: 120,
      speed: 70,
      credits: 0,
    },
  ],
  traders: [
    {
      name: 'Merchant Vessel',
      type: 'traders',
      power: 30,
      shields: 40,
      speed: 50,
      credits: 800,
    },
    {
      name: 'Trade Convoy',
      type: 'traders',
      power: 70,
      shields: 90,
      speed: 40,
      credits: 2000,
    },
    {
      name: 'Merchant Fleet',
      type: 'traders',
      power: 100,
      shields: 150,
      speed: 30,
      credits: 5000,
    },
  ],
};

export const EVENT_CONFIG = {
  baseProbability: 0.05,
  distanceMultiplier: 0.0005,
  cargoValueMultiplier: 0.00001,
  illegalGoodsMultiplier: 2,
  eventTypeWeights: {
    pirates: 0.4,
    police: 0.3,
    traders: 0.3,
  },
}; 