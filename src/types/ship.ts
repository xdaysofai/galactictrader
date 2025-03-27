export type ComponentType = 'engine' | 'cargo' | 'weapons' | 'shields' | 'fuelTank';

export interface ComponentStats {
  engine: {
    speed: number;
    fuelEfficiency: number;
  };
  cargo: {
    capacity: number;
  };
  weapons: {
    power: number;
    range: number;
  };
  shields: {
    strength: number;
    rechargeRate: number;
  };
  fuelTank: {
    capacity: number;
  };
}

export interface ShipComponent {
  type: ComponentType;
  name: string;
  level: number;
  maxLevel: number;
  stats: Partial<ComponentStats[ComponentType]>;
  upgradeCost: number;
}

export interface ShipComponents {
  engine: ShipComponent;
  cargo: ShipComponent;
  weapons: ShipComponent;
  shields: ShipComponent;
  fuelTank: ShipComponent;
}

// Base stats for each component level
export const BASE_COMPONENT_STATS: Record<ComponentType, ComponentStats[ComponentType]> = {
  engine: {
    speed: 10,
    fuelEfficiency: 1,
  },
  cargo: {
    capacity: 100,
  },
  weapons: {
    power: 10,
    range: 5,
  },
  shields: {
    strength: 100,
    rechargeRate: 1,
  },
  fuelTank: {
    capacity: 1000,
  },
};

// Cost multiplier for each level
export const UPGRADE_COST_MULTIPLIER = 1.5;
export const BASE_UPGRADE_COST = 500;

// Stat increase per level (multiplier)
export const STAT_INCREASE_PER_LEVEL = 1.2; 