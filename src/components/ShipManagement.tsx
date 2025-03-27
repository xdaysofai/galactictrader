import { useState, useEffect } from 'react';
import { ShipComponent, ShipComponents, ComponentType } from '@/types/ship';
import { canUpgradeComponent, upgradeComponent } from '@/utils/ship';
import { soundManager, SoundType } from '@/utils/soundManager';

interface ShipManagementProps {
  components: ShipComponents;
  credits: number;
  onUpgrade: (componentType: ComponentType, cost: number, newStats: ShipComponent) => void;
  onClose: (e?: React.MouseEvent) => void;
}

export default function ShipManagement({
  components,
  credits,
  onUpgrade,
  onClose,
}: ShipManagementProps) {
  const [selectedComponent, setSelectedComponent] = useState<ComponentType>('engine');

  // Add keyboard support for ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("ShipManagement close button clicked");
    soundManager.playSound(SoundType.MENU_CLOSE);
    onClose(e);
  };

  const handleUpgrade = (component: ShipComponent) => {
    if (canUpgradeComponent(component, credits)) {
      const upgradedComponent = upgradeComponent(component);
      onUpgrade(component.type, component.upgradeCost, upgradedComponent);
      soundManager.playSound(SoundType.BUTTON_CLICK);
    }
  };

  const handleSelectComponent = (type: ComponentType) => {
    setSelectedComponent(type);
    soundManager.playSound(SoundType.BUTTON_CLICK);
  };

  const renderStats = (component: ShipComponent) => {
    return Object.entries(component.stats).map(([key, value]) => (
      <div key={key} className="flex justify-between text-sm">
        <span className="text-gray-400 capitalize">{key}:</span>
        <span>{value}</span>
      </div>
    ));
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-gray-800 p-6 rounded-lg text-white max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Ship Management</h2>
          <button
            onClick={handleClose}
            className="bg-gray-700 hover:bg-red-700 text-white px-3 py-1 rounded-md"
            aria-label="Close ship management"
          >
            Close
          </button>
        </div>

        {/* Floating close button for mobile */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 bg-gray-700 hover:bg-red-700 text-white rounded-full w-8 h-8 
                    flex items-center justify-center md:hidden"
          aria-label="Close"
        >
          ×
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Component Selection */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold mb-4">Components</h3>
            {Object.values(components).map((component) => (
              <button
                key={component.type}
                onClick={() => handleSelectComponent(component.type)}
                className={`w-full p-3 rounded text-left ${
                  selectedComponent === component.type
                    ? 'bg-blue-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{component.name}</span>
                  <span className="text-sm">Level {component.level}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Component Details */}
          <div className="md:col-span-2">
            {selectedComponent && (
              <div className="bg-gray-700 p-4 rounded">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {components[selectedComponent].name}
                    </h3>
                    <p className="text-gray-400">
                      Level {components[selectedComponent].level} / {components[selectedComponent].maxLevel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Your Credits</p>
                    <p className="text-lg">{credits}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Current Stats */}
                  <div>
                    <h4 className="font-semibold mb-2">Current Stats</h4>
                    {renderStats(components[selectedComponent])}
                  </div>

                  {/* Upgrade Preview */}
                  {components[selectedComponent].level < components[selectedComponent].maxLevel && (
                    <div>
                      <h4 className="font-semibold mb-2">Next Level Preview</h4>
                      <div className="mb-2">
                        {renderStats(upgradeComponent(components[selectedComponent]))}
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                        <span>Upgrade Cost:</span>
                        <span>{components[selectedComponent].upgradeCost} credits</span>
                      </div>
                      <button
                        onClick={() => handleUpgrade(components[selectedComponent])}
                        disabled={!canUpgradeComponent(components[selectedComponent], credits)}
                        className={`w-full py-2 rounded ${
                          canUpgradeComponent(components[selectedComponent], credits)
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-gray-600 cursor-not-allowed'
                        }`}
                      >
                        {canUpgradeComponent(components[selectedComponent], credits)
                          ? 'Upgrade'
                          : credits < components[selectedComponent].upgradeCost
                          ? 'Insufficient Credits'
                          : 'Max Level Reached'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 