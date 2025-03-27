import { PlayerShip } from '@/types/galaxy';
import { ShipComponents } from '@/types/ship';
import {
  EventType,
  Enemy,
  RandomEvent,
  EventOutcome,
  CombatStats,
  ENEMY_TYPES,
  EVENT_CONFIG,
} from '@/types/events';

export const calculateEventProbability = (
  distance: number,
  cargoValue: number,
  hasIllegalGoods: boolean
): number => {
  let probability = EVENT_CONFIG.baseProbability;
  
  // Add distance factor (1% per 100 units)
  probability += distance * EVENT_CONFIG.distanceMultiplier;
  
  // Add cargo value factor (1% per 10000 credits worth of cargo)
  probability += cargoValue * EVENT_CONFIG.cargoValueMultiplier;
  
  // Double probability for illegal goods
  if (hasIllegalGoods) {
    probability *= EVENT_CONFIG.illegalGoodsMultiplier;
  }
  
  // Ensure probability is between 0 and 1
  return Math.min(Math.max(probability, 0), 1);
};

export const selectEnemy = (eventType: EventType): Enemy => {
  const enemies = ENEMY_TYPES[eventType];
  
  // Handle case where enemies array is undefined or empty
  if (!enemies || enemies.length === 0) {
    console.error(`No enemies defined for event type: ${eventType}`);
    // Return a default enemy as fallback
    return {
      name: 'Unknown Enemy',
      type: eventType,
      power: 50,
      shields: 50,
      speed: 50,
      credits: 500
    };
  }
  
  return enemies[Math.floor(Math.random() * enemies.length)];
};

export const calculateCombatStats = (
  components: ShipComponents
): CombatStats => {
  return {
    attack: (components.weapons.stats as any).power,
    defense: (components.shields.stats as any).strength,
    escapeChance: (components.engine.stats as any).speed / 20, // 0-1 probability
  };
};

export const generateEvent = (
  distance: number,
  cargoValue: number,
  hasIllegalGoods: boolean,
  forcedEventType?: EventType,
  hasCargo: boolean = true  // New parameter to check if player has cargo
): RandomEvent | null => {
  // If not forcing an event type, check probability
  if (!forcedEventType) {
    const probability = calculateEventProbability(distance, cargoValue, hasIllegalGoods);
    
    // Random check for event occurrence
    if (Math.random() > probability) {
      return null;
    }
  }

  // Use forced event type or select one based on conditions
  let eventType: EventType;
  
  if (forcedEventType) {
    // Use the forced event type
    eventType = forcedEventType;
    console.log(`Using forced event type: ${eventType}`);
  } else {
    // If no cargo, never generate police events (they're only interested in cargo)
    if (!hasCargo) {
      eventType = 'pirates'; // Only pirates will attack ships without cargo
    } else if (hasIllegalGoods && Math.random() < 0.4) {
      // 40% chance of police if carrying illegal goods
      eventType = 'police';
    } else {
      // Otherwise use the configured weights
      const random = Math.random();
      let cumulativeWeight = 0;
      for (const [type, weight] of Object.entries(EVENT_CONFIG.eventTypeWeights)) {
        cumulativeWeight += weight;
        if (random <= cumulativeWeight) {
          eventType = type as EventType;
          break;
        }
      }
      // Fallback to pirates if no event type was selected
      eventType = eventType || 'pirates';
    }
  }

  const enemy = selectEnemy(eventType);
  
  // Ensure a minimum cargoValue for calculating fines/costs
  const effectiveCargoValue = Math.max(1000, cargoValue);

  return {
    type: eventType,
    enemy,
    description: generateEventDescription(eventType, enemy, hasCargo),
    options: {
      fight: {
        description: 'Engage in combat',
        successChance: 0.5, // Will be calculated based on ship stats
      },
      flee: {
        description: 'Attempt to escape',
        successChance: 0.6, // Will be calculated based on ship speed
        fuelCost: Math.round(distance * 0.3), // 30% of travel distance
      },
      comply: {
        description: getComplyDescription(eventType, hasCargo),
        cost: getComplyCost(eventType, effectiveCargoValue, hasCargo),
      },
    },
    hasCargo, // Store whether player has cargo for reference
  };
};

export const resolveCombat = (
  playerStats: CombatStats,
  enemy: Enemy,
  action: 'fight' | 'flee' | 'comply',
  distance: number,
  cargoValue: number,
  hasCargo: boolean = true // New parameter to check if player has cargo
): EventOutcome => {
  switch (action) {
    case 'fight': {
      const successChance =
        (playerStats.attack / enemy.power + playerStats.defense / enemy.shields) / 2;
      const success = Math.random() < successChance;

      if (success) {
        return {
          success: true,
          damage: Math.round(enemy.power * Math.random() * 0.5),
          fuelCost: 0,
          creditsCost: -enemy.credits, // Gain enemy credits
          message: `Victory! You've defeated the ${enemy.name} and collected ${enemy.credits} credits.`,
        };
      } else {
        // Define the base outcome
        const baseOutcome: EventOutcome = {
          success: false,
          damage: Math.round(enemy.power * (0.5 + Math.random() * 0.5)),
          fuelCost: Math.round(distance * 0.2),
          creditsCost: Math.round(cargoValue * 0.3),
          message: `Defeat! You've suffered damage and ${hasCargo ? 'lost cargo' : 'paid credits'} while retreating.`,
        };
        
        // Only add cargo loss if player has cargo
        if (hasCargo) {
          baseOutcome.cargoLost = {
            type: 'random',
            amount: Math.round(Math.random() * 0.3 * 100), // Lose up to 30% of cargo
          };
        } else {
          // If no cargo, make them pay more credits and fuel
          baseOutcome.creditsCost = Math.max(500, Math.round(cargoValue * 0.4));
          baseOutcome.fuelCost = Math.round(distance * 0.3);
        }
        
        return baseOutcome;
      }
    }

    case 'flee': {
      const successChance = playerStats.escapeChance;
      const success = Math.random() < successChance;

      if (success) {
        return {
          success: true,
          damage: Math.round(enemy.power * Math.random() * 0.2),
          fuelCost: Math.round(distance * 0.3),
          creditsCost: 0,
          message: 'Successful escape! Used extra fuel to get away.',
        };
      } else {
        // Define the base outcome
        const baseOutcome: EventOutcome = {
          success: false,
          damage: Math.round(enemy.power * Math.random() * 0.7),
          fuelCost: Math.round(distance * 0.4),
          creditsCost: Math.round(cargoValue * 0.2),
          message: `Failed to escape! Took damage and ${hasCargo ? 'lost cargo' : 'paid credits'} while retreating.`,
        };
        
        // Only add cargo loss if player has cargo
        if (hasCargo) {
          baseOutcome.cargoLost = {
            type: 'random',
            amount: Math.round(Math.random() * 0.2 * 100), // Lose up to 20% of cargo
          };
        } else {
          // If no cargo, make them pay more credits and fuel
          baseOutcome.creditsCost = Math.max(300, Math.round(cargoValue * 0.3));
          baseOutcome.fuelCost = Math.round(distance * 0.5);
        }
        
        return baseOutcome;
      }
    }

    case 'comply': {
      if (enemy.type === 'police') {
        return {
          success: true,
          damage: 0,
          fuelCost: 0,
          creditsCost: Math.max(400, Math.round(cargoValue * 0.4)), // Fine
          message: `Paid the fine of ${Math.max(400, Math.round(cargoValue * 0.4))} credits and avoided conflict.`,
        };
      } else {
        // Pirates encounter
        if (hasCargo) {
          // If they have cargo, pirates take cargo
          return {
            success: true,
            damage: 0,
            fuelCost: 0,
            creditsCost: Math.round(cargoValue * 0.1), // Small credits cost
            cargoLost: {
              type: 'random',
              amount: Math.round(Math.random() * 0.3 * 100), // Lose up to 30% of cargo
            },
            message: 'Surrendered some cargo and avoided conflict.',
          };
        } else {
          // If no cargo, pirates demand credits and fuel
          return {
            success: true,
            damage: 0,
            fuelCost: Math.round(distance * 0.3), // Take some fuel
            creditsCost: Math.max(500, Math.round(cargoValue * 0.3)), // Take more credits
            message: 'Paid a hefty sum of credits and fuel to avoid conflict.',
          };
        }
      }
    }
  }
};

// Helper functions for event generation
const generateEventDescription = (type: EventType, enemy: Enemy, hasCargo: boolean): string => {
  switch (type) {
    case 'pirates':
      return hasCargo 
        ? `A ${enemy.name} appears! They demand your cargo and threaten to attack.`
        : `A ${enemy.name} appears! They demand payment and fuel, threatening to attack.`;
    case 'police':
      return `A ${enemy.name} hails you for inspection. They suspect illegal cargo.`;
    case 'traders':
      return `A ${enemy.name} crosses your path. They seem vulnerable.`;
    default:
      return 'An unexpected encounter occurs!';
  }
};

const getComplyDescription = (type: EventType, hasCargo: boolean): string => {
  switch (type) {
    case 'pirates':
      return hasCargo 
        ? 'Surrender cargo to avoid conflict'
        : 'Pay credits and fuel to avoid conflict';
    case 'police':
      return 'Submit to inspection and pay fines';
    case 'traders':
      return 'Let them pass peacefully';
    default:
      return 'Comply with demands';
  }
};

const getComplyCost = (type: EventType, cargoValue: number, hasCargo: boolean) => {
  switch (type) {
    case 'pirates':
      if (hasCargo) {
        return {
          cargo: {
            percentage: 30, // 30% of cargo
          },
        };
      } else {
        return {
          credits: Math.max(500, Math.round(cargoValue * 0.3)),
          fuel: 20, // Fixed fuel cost
        };
      }
    case 'police':
      // Ensure minimum fine of 400 credits
      return {
        credits: Math.max(400, Math.round(cargoValue * 0.4)), 
      };
    default:
      return {
        credits: 0,
      };
  }
}; 