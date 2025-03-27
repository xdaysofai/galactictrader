import React, { useState, useEffect } from 'react';
import { soundManager, SoundCategory, SoundType } from '@/utils/soundManager';

export default function SoundSettings() {
  const [volumes, setVolumes] = useState({
    [SoundCategory.MUSIC]: 0.5,
    [SoundCategory.SFX]: 0.7,
    [SoundCategory.AMBIENT]: 0.4,
    [SoundCategory.UI]: 0.6,
  });

  const [isMuted, setIsMuted] = useState(false);

  const handleVolumeChange = (category: SoundCategory, value: number) => {
    setVolumes(prev => ({
      ...prev,
      [category]: value
    }));
    soundManager.setVolume(category, value);

    // Play a sample sound when adjusting volume
    if (category === SoundCategory.UI) {
      soundManager.playSound(SoundType.BUTTON_CLICK);
    }
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      soundManager.unmuteAll();
    } else {
      soundManager.muteAll();
    }
    setIsMuted(!isMuted);
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">Sound Settings</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-white">Master</label>
          <button
            onClick={handleMuteToggle}
            className={`px-4 py-2 rounded ${
              isMuted ? 'bg-red-600' : 'bg-green-600'
            }`}
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-white">Music</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volumes[SoundCategory.MUSIC]}
              onChange={(e) => handleVolumeChange(SoundCategory.MUSIC, parseFloat(e.target.value))}
              className="w-48"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-white">Sound Effects</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volumes[SoundCategory.SFX]}
              onChange={(e) => handleVolumeChange(SoundCategory.SFX, parseFloat(e.target.value))}
              className="w-48"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-white">Ambient</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volumes[SoundCategory.AMBIENT]}
              onChange={(e) => handleVolumeChange(SoundCategory.AMBIENT, parseFloat(e.target.value))}
              className="w-48"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-white">UI</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volumes[SoundCategory.UI]}
              onChange={(e) => handleVolumeChange(SoundCategory.UI, parseFloat(e.target.value))}
              className="w-48"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 