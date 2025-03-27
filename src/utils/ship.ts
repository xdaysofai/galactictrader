import {
  ComponentType,
  ShipComponent,
  ShipComponents,
  BASE_COMPONENT_STATS,
  UPGRADE_COST_MULTIPLIER,
  BASE_UPGRADE_COST,
  STAT_INCREASE_PER_LEVEL,
} from '@/types/ship';

export const createInitialComponents = (): ShipComponents => {
  const createComponent = (type: ComponentType): ShipComponent => ({
    type,
    name: type.charAt(0).toUpperCase() + type.slice(1),
    level: 1,
    maxLevel: 5,
    stats: calculateComponentStats(type, 1),
    upgradeCost: calculateUpgradeCost(1),
  });

  return {
    engine: createComponent('engine'),
    cargo: createComponent('cargo'),
    weapons: createComponent('weapons'),
    shields: createComponent('shields'),
    fuelTank: createComponent('fuelTank'),
  };
};

export const calculateComponentStats = (type: ComponentType, level: number) => {
  const baseStats = BASE_COMPONENT_STATS[type];
  const multiplier = Math.pow(STAT_INCREASE_PER_LEVEL, level - 1);
  
  return Object.entries(baseStats).reduce((stats, [key, value]) => ({
    ...stats,
    [key]: Math.round(value * multiplier * 100) / 100,
  }), {});
};

export const calculateUpgradeCost = (currentLevel: number): number => {
  return Math.round(BASE_UPGRADE_COST * Math.pow(UPGRADE_COST_MULTIPLIER, currentLevel - 1));
};

export const canUpgradeComponent = (
  component: ShipComponent,
  credits: number
): boolean => {
  return component.level < component.maxLevel && credits >= component.upgradeCost;
};

export const upgradeComponent = (
  component: ShipComponent
): ShipComponent => {
  const newLevel = component.level + 1;
  
  return {
    ...component,
    level: newLevel,
    stats: calculateComponentStats(component.type, newLevel),
    upgradeCost: calculateUpgradeCost(newLevel),
  };
}; 