import { useState } from 'react';
import {
  FuelIcon,
  CargoIcon,
  CreditsIcon,
  ShieldIcon,
  KeyboardIcon,
} from './icons';
import { KEYBOARD_SHORTCUTS } from '@/utils/inputHandler';

interface HUDProps {
  fuel: number;
  maxFuel: number;
  credits: number;
  health: number;
  cargoSpace: {
    used: number;
    total: number;
  };
  onOpenMissions: () => void;
  onOpenShipManagement: () => void;
  onOpenTrading: () => void;
  onOpenSettings: () => void;
  onShowShortcuts: () => void;
}

interface StatDisplayProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: number;
  total?: number;
  label: string;
}

function StatDisplay({ icon: Icon, value, total, label }: StatDisplayProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={20} className="text-gray-400" />
      <div>
        <span className="text-gray-400">{label}:</span>{' '}
        <span className="font-medium">
          {total ? `${value}/${total}` : value}
        </span>
      </div>
    </div>
  );
}

export default function HUD({
  fuel,
  maxFuel,
  credits,
  health,
  cargoSpace,
  onOpenMissions,
  onOpenShipManagement,
  onOpenTrading,
  onOpenSettings,
  onShowShortcuts
}: HUDProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const ActionButton = ({ 
    onClick, 
    children, 
    shortcut,
    className 
  }: { 
    onClick: () => void;
    children: React.ReactNode;
    shortcut?: string;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      className={`
        relative px-4 py-2 rounded-lg transition-colors
        ${className || 'bg-gray-600 hover:bg-gray-700'}
      `}
    >
      <span>{children}</span>
      {shortcut && (
        <kbd className="absolute bottom-0 right-0 text-xs bg-black bg-opacity-50 px-1 rounded">
          {shortcut.toUpperCase()}
        </kbd>
      )}
    </button>
  );

  return (
    <div className="fixed top-0 left-0 right-0 p-4 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg p-4">
          <div className="flex flex-col md:flex-row justify-between items-stretch gap-4">
            {/* Stats Section */}
            <div className="flex flex-wrap gap-4">
              <StatDisplay
                icon={CreditsIcon}
                value={credits}
                label="Credits"
              />
              <StatDisplay
                icon={ShieldIcon}
                value={health}
                total={100}
                label="Health"
              />
              <StatDisplay
                icon={FuelIcon}
                value={fuel}
                total={maxFuel}
                label="Fuel"
              />
              <StatDisplay
                icon={CargoIcon}
                value={cargoSpace.used}
                total={cargoSpace.total}
                label="Cargo"
              />
            </div>

            {/* Actions Section */}
            <div className="flex gap-4">
              {/* Mobile Menu Button */}
              <button
                className="md:hidden bg-gray-700 hover:bg-gray-600 rounded-lg px-4 py-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                Menu
              </button>

              {/* Desktop Buttons / Mobile Menu */}
              <div className={`
                flex gap-4
                md:flex
                ${isMenuOpen ? 'flex' : 'hidden'}
                ${isMenuOpen ? 'flex-col' : 'flex-row'}
                md:flex-row
                absolute md:relative
                top-full md:top-auto
                left-0 md:left-auto
                right-0 md:right-auto
                mt-2 md:mt-0
                bg-gray-900 md:bg-transparent
                p-4 md:p-0
                rounded-lg md:rounded-none
                shadow-lg md:shadow-none
                z-50
              `}>
                <ActionButton
                  onClick={onOpenMissions}
                  className="bg-purple-600 hover:bg-purple-700"
                  shortcut={KEYBOARD_SHORTCUTS.MISSIONS}
                >
                  Missions
                </ActionButton>
                <ActionButton
                  onClick={onOpenShipManagement}
                  className="bg-blue-600 hover:bg-blue-700"
                  shortcut={KEYBOARD_SHORTCUTS.SHIP}
                >
                  Ship
                </ActionButton>
                <ActionButton
                  onClick={onOpenTrading}
                  className="bg-green-600 hover:bg-green-700"
                  shortcut={KEYBOARD_SHORTCUTS.TRADE}
                >
                  Trade
                </ActionButton>
                <ActionButton
                  onClick={onOpenSettings}
                  shortcut={KEYBOARD_SHORTCUTS.SETTINGS}
                >
                  Settings
                </ActionButton>
                <ActionButton
                  onClick={onShowShortcuts}
                  className="bg-gray-700 hover:bg-gray-800"
                >
                  <KeyboardIcon size={20} className="text-gray-300" />
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 