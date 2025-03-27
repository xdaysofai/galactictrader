import { Resource, ResourceType, MarketData, PlayerInventory, ResourceTypeValues } from '@/types/galaxy';

const BASE_PRICES: Record<ResourceTypeValues, number> = {
  // Basic Resources
  [ResourceType.metals]: 100,
  [ResourceType.water]: 50,
  [ResourceType.food]: 75,
  
  // Technology
  [ResourceType.technology]: 250,
  
  // Luxury Items
  [ResourceType.luxuryGoods]: 500,
  
  // Illegal Goods
  [ResourceType.contraband]: 800,
};

const ILLEGAL_GOODS = [
  ResourceType.contraband,
] as const;

export const calculatePrice = (resource: Resource): number => {
  const priceMultiplier = resource.demand / resource.supply;
  return Math.round(resource.basePrice * priceMultiplier);
};

export const generateMarketData = (): MarketData => {
  const market: MarketData = {};
  
  (Object.values(ResourceType) as ResourceTypeValues[]).forEach(type => {
    const baseSupply = Math.floor(Math.random() * 900) + 100; // 100-1000
    const baseDemand = Math.floor(Math.random() * 900) + 100; // 100-1000
    
    market[type] = {
      type,
      basePrice: BASE_PRICES[type],
      supply: baseSupply,
      demand: baseDemand,
      isIllegal: ILLEGAL_GOODS.includes(type as typeof ILLEGAL_GOODS[number])
    };
  });
  
  return market;
};

export const updateMarketAfterTrade = (
  market: MarketData,
  resourceType: ResourceTypeValues,
  quantity: number, // positive for buy, negative for sell
): MarketData => {
  const updatedMarket = { ...market };
  const resource = updatedMarket[resourceType];
  
  if (resource) {
    // Update supply and demand based on trade
    resource.supply = Math.max(1, resource.supply - quantity);
    resource.demand = Math.max(1, resource.demand + quantity);
  }
  
  return updatedMarket;
};

export const calculateTotalCargo = (inventory: PlayerInventory): number => {
  return Object.values(inventory).reduce((total, amount) => total + (amount || 0), 0);
};

export const canAffordPurchase = (price: number, quantity: number, credits: number): boolean => {
  return price * quantity <= credits;
};

export const canAddToCargo = (
  currentCargo: number,
  cargoCapacity: number,
  quantity: number
): boolean => {
  return currentCargo + quantity <= cargoCapacity;
}; 