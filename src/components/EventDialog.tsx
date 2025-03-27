import React, { useState, useEffect } from 'react';
import { RandomEvent, EventOutcome, CombatStats } from '@/types/events';

interface EventDialogProps {
  event: RandomEvent;
  playerStats: CombatStats;
  distance: number;
  cargoValue: number;
  onResolve: (outcome: EventOutcome) => void;
}

export default function EventDialog({
  event,
  playerStats,
  distance,
  cargoValue,
  onResolve,
}: EventDialogProps) {
  const [showOutcome, setShowOutcome] = useState(false);
  const [outcome, setOutcome] = useState<EventOutcome | null>(null);
  
  // Determine if player has cargo (from the event object)
  const hasCargo = event.hasCargo !== undefined ? event.hasCargo : true;
  
  // Ensure minimum fine amount for police encounters
  const fineAmount = Math.max(400, Math.round(cargoValue * 0.4));
  
  // For pirates when player has no cargo
  const piratePaymentAmount = Math.max(500, Math.round(cargoValue * 0.3));
  const pirateFuelAmount = Math.round(distance * 0.3);
  
  // Log event details for debugging
  useEffect(() => {
    console.log("Event details:", {
      type: event.type,
      enemy: event.enemy,
      cargoValue,
      hasCargo,
      fineAmount: event.type === 'police' ? fineAmount : 0
    });
  }, [event, cargoValue, fineAmount, hasCargo]);

  const handleAction = (action: 'fight' | 'flee' | 'comply') => {
    let result: EventOutcome;
    const { enemy } = event;

    switch (action) {
      case 'fight': {
        const successChance = (playerStats.attack / enemy.power + playerStats.defense / enemy.shields) / 2;
        const success = Math.random() < successChance;

        if (success) {
          result = {
            success: true,
            damage: Math.round(enemy.power * Math.random() * 0.5),
            fuelCost: 0,
            creditsCost: -enemy.credits,
            message: `Victory! You've defeated the ${enemy.name} and collected ${enemy.credits} credits.`,
          };
        } else {
          result = {
            success: false,
            damage: Math.round(enemy.power * (0.5 + Math.random() * 0.5)),
            fuelCost: Math.round(distance * 0.2),
            creditsCost: Math.round(cargoValue * 0.3),
            message: `Defeat! You've suffered damage and ${hasCargo ? 'lost cargo' : 'paid credits'} while retreating.`,
          };
          
          // Only add cargo loss if player has cargo
          if (hasCargo) {
            result.cargoLost = {
              type: 'random',
              amount: Math.round(Math.random() * 0.3 * 100),
            };
          } else {
            // If no cargo, increase fuel and credit cost
            result.fuelCost = Math.round(distance * 0.3);
            result.creditsCost = Math.max(500, Math.round(cargoValue * 0.4));
          }
        }
        break;
      }

      case 'flee': {
        const successChance = playerStats.escapeChance;
        const success = Math.random() < successChance;

        if (success) {
          result = {
            success: true,
            damage: Math.round(enemy.power * Math.random() * 0.2),
            fuelCost: Math.round(distance * 0.3),
            creditsCost: 0,
            message: 'Successful escape! Used extra fuel to get away.',
          };
        } else {
          result = {
            success: false,
            damage: Math.round(enemy.power * Math.random() * 0.7),
            fuelCost: Math.round(distance * 0.4),
            creditsCost: Math.round(cargoValue * 0.2),
            message: `Failed to escape! Took damage and ${hasCargo ? 'lost cargo' : 'paid credits'} while retreating.`,
          };
          
          // Only add cargo loss if player has cargo
          if (hasCargo) {
            result.cargoLost = {
              type: 'random',
              amount: Math.round(Math.random() * 0.2 * 100),
            };
          } else {
            // If no cargo, increase fuel and credit cost
            result.fuelCost = Math.round(distance * 0.5);
            result.creditsCost = Math.max(300, Math.round(cargoValue * 0.3));
          }
        }
        break;
      }

      case 'comply': {
        if (event.type === 'police') {
          result = {
            success: true,
            damage: 0,
            fuelCost: 0,
            creditsCost: fineAmount, // Use the guaranteed minimum fine amount
            message: `Paid the fine of ${fineAmount} credits and avoided conflict.`,
          };
        } else if (hasCargo) {
          // Pirates taking cargo
          result = {
            success: true,
            damage: 0,
            fuelCost: 0,
            creditsCost: Math.round(cargoValue * 0.1),
            cargoLost: {
              type: 'random',
              amount: Math.round(Math.random() * 0.3 * 100),
            },
            message: 'Surrendered some cargo and avoided conflict.',
          };
        } else {
          // Pirates taking credits and fuel when no cargo
          result = {
            success: true,
            damage: 0,
            fuelCost: pirateFuelAmount,
            creditsCost: piratePaymentAmount,
            message: `Paid ${piratePaymentAmount} credits and ${pirateFuelAmount} fuel to avoid conflict.`,
          };
        }
        break;
      }
    }

    setOutcome(result);
    setShowOutcome(true);
  };

  const handleConfirmOutcome = () => {
    if (outcome) {
      onResolve(outcome);
    }
  };

  // Determine background color based on event type
  const getEventTypeColor = () => {
    switch(event.type) {
      case 'pirates': return 'bg-red-900';
      case 'police': return 'bg-blue-900';
      case 'traders': return 'bg-green-900';
      default: return 'bg-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75">
      <div className={`${getEventTypeColor()} p-6 rounded-lg text-white max-w-2xl w-full border-2 ${event.type === 'pirates' ? 'border-red-500' : event.type === 'police' ? 'border-blue-500' : 'border-green-500'}`}>
        {!showOutcome ? (
          <>
            <h2 className="text-2xl font-bold mb-4">
              {event.type === 'pirates' && '🏴‍☠️ '}
              {event.type === 'police' && '🚨 '}
              {event.type === 'traders' && '🚀 '}
              {event.type.charAt(0).toUpperCase() + event.type.slice(1)} Encounter!
            </h2>
            <p className="text-lg mb-6">{event.description}</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-black bg-opacity-30 p-3 rounded">
                  <h3 className="font-semibold mb-2">Enemy Stats</h3>
                  <p>Ship: <span className="text-yellow-300">{event.enemy.name}</span></p>
                  <p>Power: <span className="text-red-400">{event.enemy.power}</span></p>
                  <p>Shields: <span className="text-blue-400">{event.enemy.shields}</span></p>
                  <p>Speed: <span className="text-green-400">{event.enemy.speed}</span></p>
                </div>
                <div className="bg-black bg-opacity-30 p-3 rounded">
                  <h3 className="font-semibold mb-2">Your Stats</h3>
                  <p>Attack: <span className="text-red-400">{playerStats.attack}</span></p>
                  <p>Defense: <span className="text-blue-400">{playerStats.defense}</span></p>
                  <p>Escape Chance: <span className="text-green-400">{Math.round(playerStats.escapeChance * 100)}%</span></p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleAction('fight')}
                  className="flex-1 py-3 bg-red-600 rounded hover:bg-red-700"
                >
                  Fight
                  <div className="text-sm text-gray-300">
                    Success: {Math.round(((playerStats.attack / event.enemy.power + playerStats.defense / event.enemy.shields) / 2) * 100)}%
                  </div>
                </button>
                <button
                  onClick={() => handleAction('flee')}
                  className="flex-1 py-3 bg-blue-600 rounded hover:bg-blue-700"
                >
                  Flee
                  <div className="text-sm text-gray-300">
                    Fuel Cost: {Math.round(distance * 0.3)}
                    <br />
                    Success: {Math.round(playerStats.escapeChance * 100)}%
                  </div>
                </button>
                <button
                  onClick={() => handleAction('comply')}
                  className="flex-1 py-3 bg-green-600 rounded hover:bg-green-700"
                >
                  Comply
                  <div className="text-sm text-gray-300">
                    {event.type === 'police'
                      ? `Fine: ${fineAmount} credits`
                      : hasCargo 
                        ? 'Lose 30% cargo' 
                        : `Pay ${piratePaymentAmount} credits and ${pirateFuelAmount} fuel`
                    }
                  </div>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">Encounter Result</h2>
            <p className="text-lg mb-6">{outcome?.message}</p>
            <div className="space-y-2 mb-6 bg-black bg-opacity-30 p-4 rounded">
              {outcome?.damage ? <p>Damage Taken: <span className="text-red-400">{outcome.damage}</span></p> : null}
              {outcome?.fuelCost ? <p>Fuel Used: <span className="text-yellow-400">{outcome.fuelCost}</span></p> : null}
              {outcome?.creditsCost ? (
                <p>Credits {outcome.creditsCost < 0 ? 'Gained' : 'Lost'}: <span className={outcome.creditsCost < 0 ? "text-green-400" : "text-red-400"}>{Math.abs(outcome.creditsCost)}</span></p>
              ) : null}
              {outcome?.cargoLost ? <p>Cargo Lost: <span className="text-red-400">{outcome.cargoLost.amount}%</span></p> : null}
            </div>
            <button
              onClick={handleConfirmOutcome}
              className="w-full py-3 bg-blue-600 rounded hover:bg-blue-700"
            >
              Continue Journey
            </button>
          </>
        )}
      </div>
    </div>
  );
} 