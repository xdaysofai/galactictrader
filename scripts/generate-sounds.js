const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
const dirs = [
  'public/sounds/music',
  'public/sounds/sfx',
  'public/sounds/ui',
  'public/sounds/ambient'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Generate placeholder sounds using ffmpeg
const sounds = [
  // Music (longer duration, lower frequencies)
  { 
    path: 'public/sounds/music/ambient_space.ogg',
    cmd: `ffmpeg -f lavfi -i "sine=frequency=220:duration=10" -c:a libvorbis "${path.join(process.cwd(), 'public/sounds/music/ambient_space.ogg')}"`
  },
  {
    path: 'public/sounds/music/combat.ogg',
    cmd: `ffmpeg -f lavfi -i "sine=frequency=440:duration=10" -c:a libvorbis "${path.join(process.cwd(), 'public/sounds/music/combat.ogg')}"`
  },
  {
    path: 'public/sounds/music/trading.ogg',
    cmd: `ffmpeg -f lavfi -i "sine=frequency=330:duration=10" -c:a libvorbis "${path.join(process.cwd(), 'public/sounds/music/trading.ogg')}"`
  },
  
  // SFX (short duration, varied frequencies)
  {
    path: 'public/sounds/sfx/engine_hum.ogg',
    cmd: `ffmpeg -f lavfi -i "sine=frequency=110:duration=2" -c:a libvorbis "${path.join(process.cwd(), 'public/sounds/sfx/engine_hum.ogg')}"`
  },
  {
    path: 'public/sounds/sfx/laser.ogg',
    cmd: `ffmpeg -f lavfi -i "sine=frequency=880:duration=0.5" -c:a libvorbis "${path.join(process.cwd(), 'public/sounds/sfx/laser.ogg')}"`
  },
  {
    path: 'public/sounds/sfx/explosion.ogg',
    cmd: `ffmpeg -f lavfi -i "sine=frequency=55:duration=1" -c:a libvorbis "${path.join(process.cwd(), 'public/sounds/sfx/explosion.ogg')}"`
  },
  
  // UI (very short, high frequencies)
  {
    path: 'public/sounds/ui/click.ogg',
    cmd: `ffmpeg -f lavfi -i "sine=frequency=1760:duration=0.1" -c:a libvorbis "${path.join(process.cwd(), 'public/sounds/ui/click.ogg')}"`
  },
  {
    path: 'public/sounds/ui/menu_open.ogg',
    cmd: `ffmpeg -f lavfi -i "sine=frequency=1320:duration=0.2" -c:a libvorbis "${path.join(process.cwd(), 'public/sounds/ui/menu_open.ogg')}"`
  },
  {
    path: 'public/sounds/ui/menu_close.ogg',
    cmd: `ffmpeg -f lavfi -i "sine=frequency=880:duration=0.2" -c:a libvorbis "${path.join(process.cwd(), 'public/sounds/ui/menu_close.ogg')}"`
  },
  
  // Ambient (medium duration, low frequencies)
  {
    path: 'public/sounds/ambient/market.ogg',
    cmd: `ffmpeg -f lavfi -i "sine=frequency=165:duration=5" -c:a libvorbis "${path.join(process.cwd(), 'public/sounds/ambient/market.ogg')}"`
  },
  {
    path: 'public/sounds/ambient/space_station.ogg',
    cmd: `ffmpeg -f lavfi -i "sine=frequency=82:duration=5" -c:a libvorbis "${path.join(process.cwd(), 'public/sounds/ambient/space_station.ogg')}"`
  }
];

// Generate each sound file
sounds.forEach(sound => {
  exec(sound.cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generating ${sound.path}: ${error}`);
      return;
    }
    console.log(`Generated ${sound.path}`);
  });
}); 