import React from 'react';
import { KEYBOARD_SHORTCUTS } from '@/utils/inputHandler';

interface ShortcutsHelpProps {
  onClose: () => void;
}

export default function ShortcutsHelp({ onClose }: ShortcutsHelpProps) {
  const shortcuts = [
    { key: KEYBOARD_SHORTCUTS.TRADE.toUpperCase(), action: 'Open Trading' },
    { key: KEYBOARD_SHORTCUTS.MISSIONS.toUpperCase(), action: 'Open Missions' },
    { key: KEYBOARD_SHORTCUTS.SHIP.toUpperCase(), action: 'Open Ship Management' },
    { key: 'ESC', action: 'Close Modal / Open Settings' },
    { key: 'ENTER', action: 'Confirm Action' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map(({ key, action }) => (
            <div
              key={key}
              className="flex justify-between items-center py-2 border-b border-gray-700"
            >
              <span className="text-gray-300">{action}</span>
              <kbd className="px-2 py-1 bg-gray-700 rounded text-sm font-mono">
                {key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-4 text-xs text-gray-400">
          <p>Tip: Keyboard shortcuts are disabled when typing in input fields.</p>
          <p>On mobile devices, use touch gestures to navigate menus.</p>
        </div>
      </div>
    </div>
  );
} 