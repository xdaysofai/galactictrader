import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ShipManagement from './ShipManagement';
import TradingInterface from './TradingInterface';
import MissionBoard from './MissionBoard';
import SettingsMenu from './SettingsMenu';
import ShortcutsHelp from './ShortcutsHelp';
import RiskManagement from './RiskManagement';
import { createInitialComponents } from '../utils/ship';
import { ShipComponent, ComponentType } from '../types/ship';
import { GameState } from '../utils/saveSystem';
import { PlayerInventory, ResourceTypeValues, ResourceType } from '@/types/galaxy';
import { soundManager, SoundType } from '@/utils/soundManager';
import styles from './GameHUD.module.css';
import SoundSettings from './SoundSettings';

// Define the available resources here to use in trading
const AVAILABLE_RESOURCES = [
  {
    type: ResourceType.metals,
    basePrice: 100,
    supply: 1000,
    demand: 1000,
    isIllegal: false
  },
  {
    type: ResourceType.water,
    basePrice: 50,
    supply: 1000,
    demand: 1000,
    isIllegal: false
  },
  {
    type: ResourceType.food,
    basePrice: 75,
    supply: 1000,
    demand: 1000,
    isIllegal: false
  },
  {
    type: ResourceType.technology,
    basePrice: 250,
    supply: 1000,
    demand: 1000,
    isIllegal: false
  },
  {
    type: ResourceType.luxuryGoods,
    basePrice: 500,
    supply: 1000,
    demand: 1000,
    isIllegal: false
  },
  {
    type: ResourceType.contraband,
    basePrice: 800,
    supply: 1000,
    demand: 1000,
    isIllegal: true
  }
];

// Cargo Inventory Display Component
const CargoInventory = ({ inventory, onClose }: { inventory: PlayerInventory, onClose: (e?: React.MouseEvent) => void }) => {
  // Define resource icons
  const resourceIcons: Record<string, string> = {
    [ResourceType.metals]: "🔧", // Metals
    [ResourceType.water]: "💧", // Water
    [ResourceType.food]: "🍎", // Food
    [ResourceType.technology]: "💻", // Technology
    [ResourceType.luxuryGoods]: "💎", // Luxury Goods
    [ResourceType.contraband]: "⚠️", // Contraband
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50" onClick={(e) => e.stopPropagation()}>
      <div className="bg-gray-800 rounded-lg p-6 max-w-xl w-full relative border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <span className="mr-2">📦</span> Cargo Inventory
          </h2>
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-md flex items-center"
            aria-label="Close cargo inventory"
          >
            <span className="mr-1">Close</span>
            <span className="text-lg">×</span>
          </button>
        </div>
        
        {Object.keys(inventory).length === 0 ? (
          <div className="text-white text-center p-8 bg-gray-900 rounded-lg border border-gray-700">
            <p className="text-2xl mb-4">🚀</p>
            <p className="text-xl mb-4">Your cargo hold is empty</p>
            <p className="text-gray-400">Visit a planet to trade and acquire resources</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(inventory).map(([resourceType, quantity]) => {
              const resource = AVAILABLE_RESOURCES.find(r => r.type === resourceType);
              const isIllegal = resource?.isIllegal || false;
              
              return (
                <div 
                  key={resourceType} 
                  className={`bg-gray-700 rounded-lg p-4 flex justify-between items-center transition-all hover:bg-gray-600 ${
                    isIllegal ? 'border-l-4 border-red-500' : 'border-l-4 border-blue-500'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{resourceIcons[resourceType] || '📦'}</span>
                    <div>
                      <span className="text-white font-medium text-lg">{resourceType}</span>
                      <div className="text-sm text-gray-400 mt-1">
                        {isIllegal && 
                          <span className="text-red-400 font-semibold">ILLEGAL CONTRABAND</span>
                        }
                        {!isIllegal && 
                          <span className="text-blue-400">Base value: {resource?.basePrice || 0} credits</span>
                        }
                      </div>
                    </div>
                  </div>
                  <div className="text-white text-xl font-bold bg-gray-800 py-2 px-4 rounded-lg">
                    {quantity} <span className="text-sm text-gray-400">units</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-gray-700 flex justify-between text-gray-400 text-sm">
          <div>
            <p>Total items: {Object.values(inventory).reduce((sum, qty) => sum + qty, 0)}</p>
            <p>Resource types: {Object.keys(inventory).length}</p>
          </div>
          <div>
            <p>Total estimated value: {
              Object.entries(inventory).reduce((sum, [type, qty]) => {
                const resource = AVAILABLE_RESOURCES.find(r => r.type === type);
                return sum + (resource ? resource.basePrice * qty : 0);
              }, 0)
            } credits</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Info Button Component
const InfoButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button 
      className={styles.infoButton}
      onClick={onClick}
      aria-label="How to play"
    >
      i
    </button>
  );
};

// Game Instructions Component (reused from GameInterface)
const GameInstructions = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-gray-800 rounded-lg p-6 max-w-3xl w-full relative border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">How to Play Galactic Trader</h2>
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-md flex items-center"
            aria-label="Close instructions"
          >
            <span className="mr-1">Close</span>
            <span className="text-lg">×</span>
          </button>
        </div>
        
        <div className="space-y-6 text-white">
          <section>
            <h3 className="text-xl text-purple-400 font-semibold mb-2">Game Objective</h3>
            <p className="text-gray-200">Become the most successful trader in the galaxy by buying low, selling high, and completing profitable missions across the cosmos.</p>
          </section>

          <section>
            <h3 className="text-xl text-purple-400 font-semibold mb-2">Core Mechanics</h3>
            <ul className="space-y-2 list-disc pl-5">
              <li><span className="text-blue-400 font-medium">Trading:</span> Visit different planets to buy and sell resources. Prices vary based on supply and demand.</li>
              <li><span className="text-blue-400 font-medium">Space Travel:</span> Navigate between planets, consuming fuel with each journey.</li>
              <li><span className="text-blue-400 font-medium">Ship Management:</span> Upgrade your ship's components to improve performance and cargo capacity.</li>
              <li><span className="text-blue-400 font-medium">Missions:</span> Accept missions from the mission board to earn credits and reputation.</li>
              <li><span className="text-blue-400 font-medium">Risk Management:</span> Balance high-risk, high-reward opportunities with safer ventures.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl text-purple-400 font-semibold mb-2">Controls</h3>
            <ul className="space-y-2 list-disc pl-5">
              <li><span className="text-blue-400 font-medium">Click on Planets:</span> Select a destination to travel to</li>
              <li><span className="text-blue-400 font-medium">HUD Buttons:</span> Access trading, ship management, and missions</li>
              <li><span className="text-blue-400 font-medium">ESC:</span> Open settings menu</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl text-purple-400 font-semibold mb-2">Tips for New Traders</h3>
            <ul className="space-y-2 list-disc pl-5">
              <li>Start with safe, legal cargo before risking contraband</li>
              <li>Always maintain enough fuel for your return journey</li>
              <li>Upgrade your cargo capacity early for more profitable runs</li>
              <li>Watch for price differences between planets to maximize profits</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

interface GameHUDProps {
  playerStats: {
    credits: number;
    health: number;
    fuel: number;
    cargoSpace: {
      used: number;
      total: number;
    };
  };
  setPlayerStats: React.Dispatch<React.SetStateAction<{
    credits: number;
    health: number;
    fuel: number;
    cargoSpace: {
      used: number;
      total: number;
    };
  }>>;
}

export const GameHUD: React.FC<GameHUDProps> = ({ playerStats, setPlayerStats }) => {
  const [showShipManagement, setShowShipManagement] = useState(false);
  const [showTrading, setShowTrading] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showRiskManagement, setShowRiskManagement] = useState(false);
  const [showCargoInventory, setShowCargoInventory] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [components, setComponents] = useState(createInitialComponents());
  const [missionLog, setMissionLog] = useState({ activeMissions: [], completedMissions: [] });
  const [playerReputation, setPlayerReputation] = useState(0);
  const [inventory, setInventory] = useState<PlayerInventory>({});
  
  // For simulating a current planet and target planet
  const [currentPlanet] = useState({
    name: "Mercuria",
    distance: 2.0,
    resources: [
      { type: "Metals", abundance: 85 },
      { type: "Technology", abundance: 20 },
      { type: "Water", abundance: 10 }
    ]
  });
  
  const [targetPlanet] = useState({
    name: "Aquaria",
    distance: 4.0,
    government: "Maritime Republic",
    resources: [
      { type: "Water", abundance: 95 },
      { type: "Food", abundance: 80 },
      { type: "Technology", abundance: 40 },
      { type: "Contraband", abundance: 15 }
    ]
  });

  // Add keyboard support for ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseAll();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for custom viewCargo event
  useEffect(() => {
    const handleViewCargo = (e: Event) => {
      // Close any other open interfaces
      handleCloseAll();
      
      // Open cargo inventory
      setTimeout(() => {
        setShowCargoInventory(true);
        soundManager.playSound(SoundType.MENU_OPEN);
      }, 100);
    };
    
    document.addEventListener('viewCargo', handleViewCargo);
    return () => document.removeEventListener('viewCargo', handleViewCargo);
  }, []);

  const handleCloseAll = () => {
    if (showShipManagement || showTrading || showMissions || 
        showSettings || showShortcuts || showRiskManagement || 
        showCargoInventory || showInstructions) {
      soundManager.playSound(SoundType.MENU_CLOSE);
    }
    
    setShowShipManagement(false);
    setShowTrading(false);
    setShowMissions(false);
    setShowSettings(false);
    setShowShortcuts(false);
    setShowRiskManagement(false);
    setShowCargoInventory(false);
    setShowInstructions(false);
  };

  const handleCloseShipManagement = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("Closing ship management");
    setShowShipManagement(false);
    soundManager.playSound(SoundType.MENU_CLOSE);
  };

  const handleCloseTrading = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("Closing trading interface");
    setShowTrading(false);
    soundManager.playSound(SoundType.MENU_CLOSE);
  };

  const handleCloseMissions = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("Closing missions interface");
    setShowMissions(false);
    soundManager.playSound(SoundType.MENU_CLOSE);
  };

  const handleCloseSettings = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("Closing settings interface");
    setShowSettings(false);
    soundManager.playSound(SoundType.MENU_CLOSE);
  };

  const handleCloseShortcuts = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("Closing shortcuts interface");
    setShowShortcuts(false);
    soundManager.playSound(SoundType.MENU_CLOSE);
  };

  const handleCloseRiskManagement = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("Closing risk management interface");
    setShowRiskManagement(false);
    soundManager.playSound(SoundType.MENU_CLOSE);
  };

  const handleCloseCargoInventory = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("Closing cargo inventory");
    setShowCargoInventory(false);
    soundManager.playSound(SoundType.MENU_CLOSE);
  };

  const handleCloseInstructions = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("Closing instructions");
    setShowInstructions(false);
    soundManager.playSound(SoundType.MENU_CLOSE);
  };

  const handleShowInstructions = () => {
    // Close any other open interfaces
    handleCloseAll();
    
    // Play sound when opening
    soundManager.playSound(SoundType.MENU_OPEN);
    
    // Show instructions
    setShowInstructions(true);
  };

  const handleOpenInterface = (interfaceType: 'ship' | 'trade' | 'missions' | 'risk' | 'settings' | 'help' | 'cargo') => {
    // Close any other open interface first
    handleCloseAll();
    
    // Play sound when opening a new interface
    soundManager.playSound(SoundType.MENU_OPEN);
    
    // Open the selected interface
    switch (interfaceType) {
      case 'ship':
        setShowShipManagement(true);
        break;
      case 'trade':
        setShowTrading(true);
        break;
      case 'missions':
        setShowMissions(true);
        break;
      case 'risk':
        setShowRiskManagement(true);
        break;
      case 'settings':
        setShowSettings(true);
        break;
      case 'help':
        setShowShortcuts(true);
        break;
      case 'cargo':
        setShowCargoInventory(true);
        break;
    }
  };

  const handleUpgrade = (componentType: ComponentType, cost: number, newComponent: ShipComponent) => {
    setComponents(prev => ({
      ...prev,
      [componentType]: newComponent
    }));
  };

  const handleNewGame = () => {
    setComponents(createInitialComponents());
    setMissionLog({ activeMissions: [], completedMissions: [] });
    setPlayerReputation(0);
    setInventory({});
    handleCloseAll();
  };

  const handleTrade = (resourceType: ResourceTypeValues, quantity: number, isBuying: boolean) => {
    // Debug: log initial function call
    console.log('handleTrade called:', { resourceType, quantity, isBuying });
    console.log('Current state:', { 
      credits: playerStats.credits, 
      cargoSpace: playerStats.cargoSpace,
      currentInventory: inventory 
    });
    
    // Find the corresponding resource to get its price
    const resource = AVAILABLE_RESOURCES.find(r => r.type === resourceType);
    
    if (!resource) {
      console.error(`Resource type ${resourceType} not found`);
      return;
    }
    
    // Calculate total cost/income
    const totalAmount = quantity * resource.basePrice;
    
    // Update player inventory
    setInventory(prev => {
      const current = prev[resourceType] || 0;
      const updated = {
        ...prev,
        [resourceType]: isBuying ? current + quantity : Math.max(0, current - quantity)
      };
      
      // For buying, check if we have credits and cargo space
      if (isBuying) {
        if (totalAmount > playerStats.credits) {
          soundManager.playSound(SoundType.BUTTON_CLICK);
          console.error('Not enough credits!');
          return prev; // Don't update if we can't afford it
        }
        
        const newUsedSpace = Object.values(updated).reduce((sum, amount) => sum + amount, 0);
        if (newUsedSpace > playerStats.cargoSpace.total) {
          soundManager.playSound(SoundType.BUTTON_CLICK);
          console.error('Not enough cargo space!');
          return prev; // Don't update if we're out of space
        }
      }
      
      // Play appropriate sound
      if (isBuying) {
        soundManager.playSound(SoundType.TRADE_SUCCESS);
      } else {
        soundManager.playSound(SoundType.TRADE_SUCCESS);
      }
      
      return updated;
    });
    
    // Update player credits and cargo space in a single update
    setPlayerStats(prev => {
      const newUsed = isBuying 
        ? prev.cargoSpace.used + quantity 
        : prev.cargoSpace.used - quantity;
        
      const newStats = {
        ...prev,
        credits: isBuying 
          ? prev.credits - totalAmount  // Subtract when buying
          : prev.credits + totalAmount, // Add when selling
        cargoSpace: {
          ...prev.cargoSpace,
          used: Math.max(0, newUsed)
        }
      };
      
      console.log('Updated player stats:', newStats);
      return newStats;
    });
    
    console.log(`${isBuying ? 'Bought' : 'Sold'} ${quantity} ${resourceType} for ${totalAmount} credits`);
    
    // If this was a purchase, show a notification that item was added to cargo
    if (isBuying) {
      // Create a temporary notification
      const notification = document.createElement('div');
      notification.textContent = `Added ${quantity} ${resourceType} to cargo`;
      notification.style.position = 'fixed';
      notification.style.top = '20%';
      notification.style.left = '50%';
      notification.style.transform = 'translateX(-50%)';
      notification.style.background = 'rgba(0, 128, 0, 0.8)';
      notification.style.color = 'white';
      notification.style.padding = '10px 20px';
      notification.style.borderRadius = '5px';
      notification.style.zIndex = '1000';
      notification.style.cursor = 'pointer';
      
      // Add ability to click on notification to view cargo
      notification.onclick = () => {
        handleCloseAll();
        setTimeout(() => {
          handleOpenInterface('cargo');
        }, 100);
        document.body.removeChild(notification);
      };
      
      document.body.appendChild(notification);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
    }
    
    // Debug: log state at end of function
    console.log('Trade completed successfully');
  };

  const hasIllegalGoods = Object.keys(inventory).some(type => 
    type.toLowerCase() === 'contraband' && inventory[type] > 0
  );

  const gameState: GameState = {
    player: {
      position: [0, 0, 0],
      fuel: playerStats.fuel,
      maxFuel: 100,
      speed: 10,
      credits: playerStats.credits,
      cargoCapacity: playerStats.cargoSpace.total,
      inventory: inventory
    },
    components,
    missionLog,
    playerReputation,
    health: playerStats.health,
    fuel: playerStats.fuel,
    lastSaved: new Date().toISOString()
  };

  return (
    <div className={styles.hud}>
      {/* Info Button */}
      <InfoButton onClick={handleShowInstructions} />

      <div className={styles.statsPanel}>
        <div className={styles.mainStats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Credits:</span>
            <span className={styles.statValue}>{playerStats.credits}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Health:</span>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ 
                  width: `${playerStats.health}%`,
                  backgroundColor: `rgba(${255 - playerStats.health * 2.55}, ${playerStats.health * 2.55}, 0, 0.8)`
                }}
              />
            </div>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Fuel:</span>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ 
                  width: `${playerStats.fuel}%`,
                  backgroundColor: playerStats.fuel < 20 ? '#ff3300' : '#33ccff'
                }}
              />
            </div>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Cargo:</span>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ 
                  width: `${(playerStats.cargoSpace.used / playerStats.cargoSpace.total) * 100}%`,
                  backgroundColor: playerStats.cargoSpace.used > playerStats.cargoSpace.total * 0.8 ? '#ff9900' : '#66cc66'
                }}
              />
            </div>
            <span className={styles.cargoText}>
              {playerStats.cargoSpace.used}/{playerStats.cargoSpace.total}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.buttonPanel}>
        <button onClick={() => handleOpenInterface('ship')}>Ship</button>
        <button onClick={() => handleOpenInterface('trade')}>Trade</button>
        <button onClick={() => handleOpenInterface('missions')}>Missions</button>
        <button onClick={() => handleOpenInterface('risk')}>Risk Analysis</button>
        <button onClick={() => handleOpenInterface('settings')}>Settings</button>
        <button onClick={() => handleOpenInterface('help')}>Help</button>
        <button onClick={() => handleOpenInterface('cargo')}>Cargo</button>
      </div>

      <div className={styles.modalContainer}>
        <AnimatePresence>
          {showShipManagement && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={styles.modalOverlay}
              onClick={(e) => {
                // Close only if clicking directly on the overlay
                if (e.target === e.currentTarget) {
                  handleCloseShipManagement();
                }
              }}
            >
              <ShipManagement
                components={components}
                credits={playerStats.credits}
                onUpgrade={handleUpgrade}
                onClose={handleCloseShipManagement}
              />
            </motion.div>
          )}

          {showTrading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={styles.modalOverlay}
              onClick={(e) => {
                // Close only if clicking directly on the overlay
                if (e.target === e.currentTarget) {
                  handleCloseTrading();
                }
              }}
            >
              <TradingInterface
                player={{
                  credits: playerStats.credits,
                  inventory: inventory,
                  cargoCapacity: playerStats.cargoSpace.total
                }}
                onTrade={handleTrade}
                onClose={handleCloseTrading}
              />
            </motion.div>
          )}

          {showMissions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={styles.modalOverlay}
              onClick={(e) => {
                // Close only if clicking directly on the overlay
                if (e.target === e.currentTarget) {
                  handleCloseMissions();
                }
              }}
            >
              <MissionBoard
                availableMissions={[]}
                missionLog={missionLog}
                playerReputation={playerReputation}
                onAcceptMission={() => {}}
                onClose={handleCloseMissions}
              />
            </motion.div>
          )}
          
          {showRiskManagement && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={styles.modalOverlay}
              onClick={(e) => {
                // Close only if clicking directly on the overlay
                if (e.target === e.currentTarget) {
                  handleCloseRiskManagement();
                }
              }}
            >
              <RiskManagement
                playerCredits={playerStats.credits}
                cargoCapacity={playerStats.cargoSpace.total}
                hasIllegalGoods={hasIllegalGoods}
                currentPlanet={currentPlanet}
                targetPlanet={targetPlanet}
                onClose={handleCloseRiskManagement}
              />
            </motion.div>
          )}

          {showSettings && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={styles.modalOverlay}
              onClick={(e) => {
                // Close only if clicking directly on the overlay
                if (e.target === e.currentTarget) {
                  handleCloseSettings();
                }
              }}
            >
              <SettingsMenu
                gameState={gameState}
                onClose={handleCloseSettings}
                onNewGame={handleNewGame}
              />
            </motion.div>
          )}

          {showShortcuts && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={styles.modalOverlay}
              onClick={(e) => {
                // Close only if clicking directly on the overlay
                if (e.target === e.currentTarget) {
                  handleCloseShortcuts();
                }
              }}
            >
              <ShortcutsHelp onClose={handleCloseShortcuts} />
            </motion.div>
          )}

          {showCargoInventory && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={styles.modalOverlay}
              onClick={(e) => {
                // Close only if clicking directly on the overlay
                if (e.target === e.currentTarget) {
                  handleCloseCargoInventory();
                }
              }}
            >
              <CargoInventory
                inventory={inventory}
                onClose={handleCloseCargoInventory}
              />
            </motion.div>
          )}

          {showInstructions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={styles.modalOverlay}
              onClick={(e) => {
                // Close only if clicking directly on the overlay
                if (e.target === e.currentTarget) {
                  handleCloseInstructions();
                }
              }}
            >
              <GameInstructions onClose={handleCloseInstructions} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Global close button that's always accessible when any modal is open */}
      {(showShipManagement || showTrading || showMissions || 
        showSettings || showShortcuts || showRiskManagement || 
        showCargoInventory || showInstructions) && (
        <button 
          className={styles.globalCloseButton}
          onClick={handleCloseAll}
          aria-label="Close all interfaces"
        >
          ×
        </button>
      )}
    </div>
  );
}; 