import React, { useState, useEffect } from 'react';
import { Resource, ResourceType } from '@/types/galaxy';
import { soundManager, SoundType } from '@/utils/soundManager';

interface PlayerShip {
  credits: number;
  inventory: Record<string, number>;
  cargoCapacity: number;
}

interface TradingInterfaceProps {
  player: PlayerShip;
  onTrade: (resourceType: string, quantity: number, isBuying: boolean) => void;
  onClose: (e?: React.MouseEvent) => void;
}

const AVAILABLE_RESOURCES: Resource[] = [
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

export default function TradingInterface({ player, onTrade, onClose }: TradingInterfaceProps) {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [isBuying, setIsBuying] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'Enter' && selectedResource && quantity > 0) {
        handleTrade();
      } else if (e.key === 'b') {
        setIsBuying(true);
      } else if (e.key === 's') {
        setIsBuying(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, selectedResource, quantity]);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("TradingInterface close button clicked");
    onClose(e);
  };

  const currentCargo = Object.values(player.inventory).reduce((total, amount) => total + amount, 0);

  const handleQuantityChange = (value: number) => {
    if (value < 0) return;
    
    if (isBuying) {
      // Calculate max affordable quantity
      const maxAffordable = Math.floor(player.credits / (selectedResource?.basePrice || 1));
      // Calculate max cargo space
      const maxCargo = player.cargoCapacity - currentCargo;
      // Use the smaller of the two limits
      value = Math.min(value, maxAffordable, maxCargo);
    } else if (selectedResource) {
      // Limit to available quantity for selling
      const maxSellable = player.inventory[selectedResource.type] || 0;
      value = Math.min(value, maxSellable);
    }
    
    setQuantity(value);
    setError('');
  };

  const handleQuickQuantity = (percentage: number) => {
    if (!selectedResource) return;

    if (isBuying) {
      const maxAffordable = Math.floor(player.credits / selectedResource.basePrice);
      const maxCargo = player.cargoCapacity - currentCargo;
      const maxQuantity = Math.min(maxAffordable, maxCargo);
      handleQuantityChange(Math.floor(maxQuantity * (percentage / 100)));
    } else {
      const maxSellable = player.inventory[selectedResource.type] || 0;
      handleQuantityChange(Math.floor(maxSellable * (percentage / 100)));
    }
  };

  const handleTrade = () => {
    if (!selectedResource || quantity <= 0) return;

    try {
      onTrade(selectedResource.type, quantity, isBuying);
      soundManager.playSound(SoundType.TRADE_SUCCESS);
      setQuantity(0);
      setError('');
    } catch (error) {
      console.error('Error in onTrade:', error);
      setError('An error occurred while processing your trade');
      soundManager.playSound(SoundType.BUTTON_CLICK);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Trading Interface</h2>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-400">
              <span>Shortcuts: </span>
              <kbd className="px-1 bg-gray-700 rounded">B</kbd>
              <span> Buy, </span>
              <kbd className="px-1 bg-gray-700 rounded">S</kbd>
              <span> Sell, </span>
              <kbd className="px-1 bg-gray-700 rounded">Enter</kbd>
              <span> Trade</span>
            </div>
            <button
              onClick={handleClose}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-md flex items-center"
              aria-label="Close trading interface"
            >
              <span className="mr-1">Close</span>
              <span className="text-lg">×</span>
            </button>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-white">Credits: {player.credits}</p>
          <div className="flex justify-between items-center mt-2">
            <p className="text-white">Cargo Space: {currentCargo} / {player.cargoCapacity}</p>
            <button 
              onClick={() => {
                const viewCargoEvent = new CustomEvent('viewCargo', {
                  detail: { source: 'tradingInterface' }
                });
                document.dispatchEvent(viewCargoEvent);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center text-sm"
            >
              <span className="mr-1">📦</span> View Cargo
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-2 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Available Resources</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {AVAILABLE_RESOURCES.map((resource) => {
                const inventoryAmount = player.inventory[resource.type] || 0;
                const maxBuyable = Math.floor(player.credits / resource.basePrice);
                const maxSellable = inventoryAmount;
                
                return (
                  <button
                    key={resource.type}
                    onClick={() => setSelectedResource(resource)}
                    className={`w-full p-2 rounded text-left transition-colors duration-200 ${
                      selectedResource?.type === resource.type
                        ? 'bg-blue-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-white">{resource.type}</span>
                      <span className="text-gray-300">{resource.basePrice} credits</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      <div>In inventory: {inventoryAmount}</div>
                      <div>Can {isBuying ? 'buy' : 'sell'}: {isBuying ? maxBuyable : maxSellable}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Trade Details</h3>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => setIsBuying(true)}
                  className={`flex-1 py-3 rounded transition-colors duration-200 ${
                    isBuying ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  Buy (B)
                </button>
                <button
                  onClick={() => setIsBuying(false)}
                  className={`flex-1 py-3 rounded transition-colors duration-200 ${
                    !isBuying ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  Sell (S)
                </button>
              </div>

              <div>
                <label className="block text-white mb-2">Quantity</label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
                    className="flex-1 bg-gray-700 text-white p-2 rounded"
                    min="0"
                  />
                  <button
                    onClick={() => handleQuickQuantity(100)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                  >
                    Max
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map((percent) => (
                    <button
                      key={percent}
                      onClick={() => handleQuickQuantity(percent)}
                      className="bg-gray-700 hover:bg-gray-600 text-white py-1 rounded text-sm"
                    >
                      {percent}%
                    </button>
                  ))}
                </div>
              </div>

              {selectedResource && (
                <div className="text-white space-y-2">
                  <p>Price per unit: {selectedResource.basePrice} credits</p>
                  <p>Total {isBuying ? 'Cost' : 'Income'}: {quantity * selectedResource.basePrice} credits</p>
                </div>
              )}

              <button
                onClick={handleTrade}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors duration-200"
                disabled={!selectedResource || quantity <= 0}
              >
                Confirm Trade (Enter)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 