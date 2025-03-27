import React, { useEffect } from 'react';
import { Mission, MissionLog } from '@/types/missions';
import { soundManager, SoundType } from '@/utils/soundManager';

interface MissionBoardProps {
  availableMissions: Mission[];
  missionLog: MissionLog;
  playerReputation: number;
  onAcceptMission: (mission: Mission) => void;
  onClose: (e?: React.MouseEvent) => void;
}

export default function MissionBoard({
  availableMissions,
  missionLog,
  playerReputation,
  onAcceptMission,
  onClose
}: MissionBoardProps) {
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
    console.log("MissionBoard close button clicked");
    soundManager.playSound(SoundType.MENU_CLOSE);
    onClose(e);
  };

  const handleAcceptMission = (mission: Mission) => {
    soundManager.playSound(SoundType.BUTTON_CLICK);
    onAcceptMission(mission);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-gray-800 rounded-lg p-4 w-full max-w-md relative">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-white">Mission Board</h2>
          <button
            onClick={handleClose}
            className="bg-gray-700 hover:bg-red-700 text-white px-3 py-1 rounded-md"
            aria-label="Close mission board"
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

        <div className="text-sm text-gray-300 mb-3">
          Reputation: {playerReputation}
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          <div className="mb-2">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Available Missions</h3>
            {availableMissions.length > 0 ? (
              availableMissions.map((mission) => (
                <div
                  key={mission.id}
                  className="bg-gray-700 rounded p-2 mb-2 text-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-white">{mission.title}</div>
                      <div className="text-gray-300 text-xs mt-1">{mission.description}</div>
                    </div>
                    <button
                      onClick={() => handleAcceptMission(mission)}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                    >
                      Accept
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    <span>Reward: {mission.reward.credits} credits</span>
                    {mission.reward.reputation > 0 && (
                      <span className="ml-2">
                        Rep: +{mission.reward.reputation}
                      </span>
                    )}
                    {mission.requiredReputation > 0 && (
                      <span className="ml-2">
                        Required Rep: {mission.requiredReputation}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-sm">No missions available</div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">Active Missions</h3>
            {missionLog.activeMissions.length > 0 ? (
              missionLog.activeMissions.map((mission) => (
                <div
                  key={mission.id}
                  className="bg-gray-700 rounded p-2 mb-2 text-sm"
                >
                  <div className="font-medium text-white">{mission.title}</div>
                  <div className="text-gray-300 text-xs mt-1">
                    Progress: {mission.progress.current}/{mission.progress.required}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-sm">No active missions</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 