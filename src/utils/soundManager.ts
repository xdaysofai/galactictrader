import { Howl, Howler } from 'howler';

// Define sound categories
export enum SoundCategory {
  MUSIC = 'music',
  SFX = 'sfx',
  AMBIENT = 'ambient',
  UI = 'ui'
}

// Define sound types
export enum SoundType {
  // Music
  AMBIENT_SPACE = 'ambient_space',
  COMBAT_MUSIC = 'combat_music',
  TRADING_MUSIC = 'trading_music',
  
  // Ship sounds
  ENGINE_HUM = 'engine_hum',
  ENGINE_BOOST = 'engine_boost',
  LASER_SHOT = 'laser_shot',
  EXPLOSION = 'explosion',
  
  // UI sounds
  BUTTON_CLICK = 'button_click',
  MENU_OPEN = 'menu_open',
  MENU_CLOSE = 'menu_close',
  TRADE_SUCCESS = 'trade_success',
  
  // Ambient
  MARKET_AMBIENT = 'market_ambient',
  SPACE_STATION_HUM = 'space_station_hum'
}

interface Sound {
  howl: Howl;
  category: SoundCategory;
}

class SoundManager {
  private static instance: SoundManager;
  private sounds: Map<SoundType, Sound>;
  private volumes: Map<SoundCategory, number>;
  private engineSound?: Howl;
  private currentMusic?: Howl;

  private constructor() {
    this.sounds = new Map();
    this.volumes = new Map([
      [SoundCategory.MUSIC, 0.5],
      [SoundCategory.SFX, 0.7],
      [SoundCategory.AMBIENT, 0.4],
      [SoundCategory.UI, 0.6]
    ]);

    // Initialize Howler global settings
    Howler.autoUnlock = true;
    Howler.autoSuspend = false;
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public init(): void {
    // Initialize all sounds
    this.loadSounds();
  }

  private loadSounds(): void {
    // Music
    this.registerSound(SoundType.AMBIENT_SPACE, {
      src: ['/sounds/music/ambient_space.ogg'],
      loop: true,
      volume: this.volumes.get(SoundCategory.MUSIC) || 0.5
    }, SoundCategory.MUSIC);

    this.registerSound(SoundType.COMBAT_MUSIC, {
      src: ['/sounds/music/combat.ogg'],
      loop: true,
      volume: this.volumes.get(SoundCategory.MUSIC) || 0.5
    }, SoundCategory.MUSIC);

    // Ship sounds
    this.registerSound(SoundType.ENGINE_HUM, {
      src: ['/sounds/sfx/engine_hum.ogg'],
      loop: true,
      volume: 0,
      rate: 1.0
    }, SoundCategory.SFX);

    this.registerSound(SoundType.LASER_SHOT, {
      src: ['/sounds/sfx/laser.ogg'],
      volume: this.volumes.get(SoundCategory.SFX) || 0.7
    }, SoundCategory.SFX);

    // UI sounds
    this.registerSound(SoundType.BUTTON_CLICK, {
      src: ['/sounds/ui/click.ogg'],
      volume: this.volumes.get(SoundCategory.UI) || 0.6
    }, SoundCategory.UI);

    // Ambient sounds
    this.registerSound(SoundType.MARKET_AMBIENT, {
      src: ['/sounds/ambient/market.ogg'],
      loop: true,
      volume: this.volumes.get(SoundCategory.AMBIENT) || 0.4
    }, SoundCategory.AMBIENT);
  }

  private registerSound(type: SoundType, options: Howl.Options, category: SoundCategory): void {
    this.sounds.set(type, {
      howl: new Howl(options),
      category
    });
  }

  public playSound(type: SoundType): number {
    const sound = this.sounds.get(type);
    if (sound) {
      return sound.howl.play();
    }
    return -1;
  }

  public stopSound(type: SoundType): void {
    const sound = this.sounds.get(type);
    if (sound) {
      sound.howl.stop();
    }
  }

  public setEngineSound(speed: number): void {
    const engineSound = this.sounds.get(SoundType.ENGINE_HUM);
    if (engineSound) {
      const volume = Math.min(speed * 0.7, 1.0) * (this.volumes.get(SoundCategory.SFX) || 0.7);
      const rate = 0.8 + speed * 0.4; // Adjust pitch based on speed
      engineSound.howl.volume(volume);
      engineSound.howl.rate(rate);
    }
  }

  public playMusic(type: SoundType.AMBIENT_SPACE | SoundType.COMBAT_MUSIC | SoundType.TRADING_MUSIC): void {
    // Stop current music if playing
    if (this.currentMusic) {
      this.currentMusic.stop();
    }

    const music = this.sounds.get(type);
    if (music) {
      this.currentMusic = music.howl;
      music.howl.play();
    }
  }

  public setVolume(category: SoundCategory, volume: number): void {
    this.volumes.set(category, volume);
    
    // Update all sounds in the category
    this.sounds.forEach((sound, type) => {
      if (sound.category === category) {
        sound.howl.volume(volume);
      }
    });
  }

  public muteAll(): void {
    Howler.mute(true);
  }

  public unmuteAll(): void {
    Howler.mute(false);
  }
}

export const soundManager = SoundManager.getInstance(); 