export const ResourceType = {
  // Basic Resources
  metals: 'Metals',
  water: 'Water',
  food: 'Food',
  
  // Technology
  technology: 'Technology',
  
  // Luxury Items
  luxuryGoods: 'Luxury Goods',
  
  // Illegal Goods
  contraband: 'Contraband',
} as const;

export type ResourceTypeKeys = keyof typeof ResourceType;
export type ResourceTypeValues = typeof ResourceType[ResourceTypeKeys];

export type Resource = {
  type: ResourceTypeValues;
  basePrice: number;
  supply: number;
  demand: number;
  isIllegal: boolean;
};

export type MarketData = {
  [K in ResourceTypeValues]?: Resource;
};

export type PlayerInventory = {
  [K in ResourceTypeValues]?: number;
};

export type PlayerShip = {
  position: [number, number, number];
  fuel: number;
  maxFuel: number;
  speed: number;
  credits: number;
  cargoCapacity: number;
  inventory: PlayerInventory;
};

export type CelestialBody = {
  id: string;
  name: string;
  type: 'planet' | 'station';
  position: [number, number, number];
  market: MarketData;
};

export type TravelCalculation = {
  distance: number;
  fuelCost: number;
  travelTime: number;
};

export const FUEL_PER_UNIT = 0.1; // Fuel consumption per unit of distance 