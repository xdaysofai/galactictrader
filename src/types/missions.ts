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
  items?: Array<{
    type: string;
    amount: number;
  }>;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'delivery' | 'combat' | 'exploration' | 'trade';
  reward: MissionReward;
  requiredReputation: number;
  status?: 'active' | 'completed' | 'failed';
  progress: {
    current: number;
    required: number;
  };
  timeLimit?: number;
  destination?: string;
  cargo?: {
    type: string;
    amount: number;
  };
}

export interface MissionLog {
  activeMissions: Mission[];
  completedMissions: Mission[];
}

// Mission generation templates
export const MISSION_TEMPLATES = {
  delivery: {
    title: 'Cargo Delivery',
    description: 'Transport valuable cargo to a specified location.',
    baseReward: 1000,
    riskMultiplier: 1.2,
    timeMultiplier: 0.8,
  },
  smuggling: {
    title: 'Covert Transport',
    description: 'Discreetly move sensitive cargo avoiding authorities.',
    baseReward: 2000,
    riskMultiplier: 2.0,
    timeMultiplier: 0.6,
  },
  bounty: {
    title: 'Bounty Hunt',
    description: 'Track down and eliminate target.',
    baseReward: 1500,
    riskMultiplier: 1.8,
    timeMultiplier: 0.7,
  },
  trade: {
    title: 'Market Opportunity',
    description: 'Purchase specific goods and deliver them for profit.',
    baseReward: 800,
    riskMultiplier: 1.0,
    timeMultiplier: 1.0,
  },
} as const;

export const generateMission = (
  type: Mission['type'],
  playerReputation: number = 0
): Mission => {
  const id = Math.random().toString(36).substr(2, 9);
  const baseReward = Math.floor(Math.random() * 1000) + 500;
  const requiredRep = Math.max(0, Math.floor(playerReputation - 2));

  return {
    id,
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Mission`,
    description: `A standard ${type} mission`,
    type,
    reward: {
      credits: baseReward,
      reputation: Math.floor(baseReward / 100)
    },
    requiredReputation: requiredRep,
    progress: {
      current: 0,
      required: Math.floor(Math.random() * 5) + 1
    }
  };
}; 