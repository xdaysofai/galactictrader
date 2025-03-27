import React, { useState } from 'react';
import { saveGame, deleteSave, GameState } from '@/utils/saveSystem';
import SoundSettings from './SoundSettings';

interface SettingsMenuProps {
  gameState: GameState;
  onClose: () => void;
  onNewGame: () => void;
}

export default function SettingsMenu({ gameState, onClose, onNewGame }: SettingsMenuProps) {
  const [activeTab, setActiveTab] = useState<'game' | 'sound'>('game');

  const handleSave = () => {
    try {
      saveGame(gameState);
      // Show success message
      alert('Game saved successfully!');
    } catch (error) {
      // Show error message
      alert('Failed to save game. Please try again.');
    }
  };

  const handleDeleteSave = () => {
    if (window.confirm('Are you sure you want to delete your save file? This cannot be undone.')) {
      try {
        deleteSave();
        onNewGame();
        onClose();
      } catch (error) {
        alert('Failed to delete save file. Please try again.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setActiveTab('game')}
            className={`px-4 py-2 rounded ${
              activeTab === 'game'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Game
          </button>
          <button
            onClick={() => setActiveTab('sound')}
            className={`px-4 py-2 rounded ${
              activeTab === 'sound'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Sound
          </button>
        </div>

        {activeTab === 'game' ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-300">
              Last Saved: {gameState.lastSaved ? new Date(gameState.lastSaved).toLocaleString() : 'Never'}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleSave}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Save Game
              </button>
              
              <button
                onClick={handleDeleteSave}
                className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
              >
                Delete Save File
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-400">
              <p>Game data is saved locally in your browser.</p>
              <p>Clearing your browser data will delete your save file.</p>
            </div>
          </div>
        ) : (
          <SoundSettings />
        )}
      </div>
    </div>
  );
} 