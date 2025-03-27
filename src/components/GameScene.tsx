import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import styles from './GameScene.module.css';
import { generateMarketData, updateMarketAfterTrade } from '@/utils/market';
import { generateMission } from '@/utils/missions';
import { generateEvent, calculateEventProbability, resolveCombat } from '@/utils/events';
import { MarketData, PlayerInventory, Resource } from '@/types/galaxy';
import { Mission } from '@/types/missions';
import { RandomEvent, EventOutcome, CombatStats } from '@/types/events';
import TradingInterface from './TradingInterface';
import EventDialog from './EventDialog';
import { soundManager, SoundType } from '@/utils/soundManager';
import PlanetInfo from './PlanetInfo';
import { AnimatePresence } from 'framer-motion';

interface GameSceneProps {
  setPlayerStats?: React.Dispatch<React.SetStateAction<{
    credits: number;
    health: number;
    fuel: number;
    cargoSpace: {
      used: number;
      total: number;
    };
  }>>;
}

interface CelestialBody {
  mesh: THREE.Group;
  orbitRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  planetData?: {
    name: string;
    type: string;
    resources: {
      type: string;
      abundance: number;
    }[];
    description: string;
    population: number;
    government: string;
  };
}

interface Ship {
  mesh: THREE.Group;
  speed: number;
  direction: THREE.Vector3;
  type: 'player' | 'pirate' | 'police' | 'trader';
  targetPlanet?: CelestialBody;
  isMoving: boolean;
  orbitAngle?: number;
  orbitRadius?: number;
  isOrbiting?: boolean;
}

interface GameState {
  credits: number;
  inventory: PlayerInventory;
  missions: Mission[];
  marketData: MarketData;
  currentEvent: RandomEvent | null;
  playerStats: {
    attack: number;
    defense: number;
    speed: number;
  };
  fuel: number;
  health: number;
}

export const GameScene: React.FC<GameSceneProps> = ({ setPlayerStats }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const celestialBodiesRef = useRef<CelestialBody[]>([]);
  const shipsRef = useRef<Ship[]>([]);
  
  // Replace ref with state for selected planet to trigger re-renders
  const [selectedPlanet, setSelectedPlanet] = useState<CelestialBody | null>(null);

  // Add game state
  const [gameState, setGameState] = useState<GameState>({
    credits: 1000,
    inventory: {},
    missions: [],
    marketData: generateMarketData(),
    currentEvent: null,
    playerStats: {
      attack: 50,
      defense: 40,
      speed: 60
    },
    fuel: 100,
    health: 100
  });

  const [showTrading, setShowTrading] = useState(false);
  const [showPlanetInfo, setShowPlanetInfo] = useState(false);

  // Handle trading
  const handleTrade = (resource: Resource, quantity: number, isBuying: boolean) => {
    setGameState(prevState => {
      const newState = { ...prevState };
      const cost = resource.basePrice * quantity;

      if (isBuying) {
        if (cost > newState.credits) {
          soundManager.playSound(SoundType.BUTTON_CLICK);
          return prevState;
        }
        newState.credits -= cost;
        newState.inventory[resource.type] = (newState.inventory[resource.type] || 0) + quantity;
        soundManager.playSound(SoundType.TRADE_SUCCESS);
      } else {
        if ((newState.inventory[resource.type] || 0) < quantity) {
          soundManager.playSound(SoundType.BUTTON_CLICK);
          return prevState;
        }
        newState.credits += cost;
        newState.inventory[resource.type] = (newState.inventory[resource.type] || 0) - quantity;
        soundManager.playSound(SoundType.TRADE_SUCCESS);
      }

      newState.marketData = updateMarketAfterTrade(newState.marketData, resource.type, isBuying ? quantity : -quantity);
      return newState;
    });
  };

  // Handle random events
  const checkForRandomEvent = () => {
    // Get total cargo amount
    const totalCargo = Object.values(gameState.inventory).reduce((sum, amount) => sum + amount, 0);
    const hasCargo = totalCargo > 0;
    
    // Calculate cargo value for event generation - ensure minimum value to avoid 0 fines
    const cargoValue = Math.max(
      1000, // Minimum cargo value for fine calculation
      Object.entries(gameState.inventory).reduce((total, [type, amount]) => {
        const resource = gameState.marketData[type as keyof typeof gameState.marketData];
        return total + (resource ? resource.basePrice * amount : 0);
      }, 0)
    );

    const hasIllegalGoods = Object.keys(gameState.inventory).some(type => 
      type === 'contraband' && gameState.inventory[type as keyof typeof gameState.inventory] > 0
    );

    // More balanced encounter chance - 45% chance of an encounter
    const baseEncounterChance = 0.45;
    
    // Increase chance based on cargo value and illegal goods
    let encounterChance = baseEncounterChance;
    
    // More cargo = higher chance of pirates
    if (cargoValue > 500 && hasCargo) {
      encounterChance += 0.1;
    }
    
    // Illegal goods = higher chance of police
    if (hasIllegalGoods) {
      encounterChance += 0.15;
    }
    
    // Cap at 75% to ensure it's not every time
    encounterChance = Math.min(encounterChance, 0.75);
    
    if (Math.random() <= encounterChance) {
      // Ensure a mix of encounters with pirates appearing more frequently
      const randomNum = Math.random();
      let eventType: 'pirates' | 'police' | undefined;
      
      // If no cargo, never generate police events (they're only interested in cargo)
      if (!hasCargo) {
        eventType = 'pirates'; // Only pirates will attack ships without cargo
      } else if (randomNum < 0.6) {
        // 60% chance for pirates
        eventType = 'pirates';
      } else if (randomNum < 0.9 && hasIllegalGoods) {
        // 30% chance for police but only if the player has illegal goods
        eventType = 'police';
      } else {
        // Default to pirates if police wouldn't make sense
        eventType = 'pirates';
      }
      
      // Generate the event with forced event type
      const event = generateEvent(
        100, 
        cargoValue, 
        hasIllegalGoods, 
        eventType,
        hasCargo // Pass information about whether player has cargo
      );
      
      if (event) {
        console.log("Random event triggered:", event);
        console.log("Cargo value for fine calculation:", cargoValue);
        console.log("Player has cargo:", hasCargo);
        soundManager.playMusic(SoundType.COMBAT_MUSIC);
        setGameState(prev => ({ ...prev, currentEvent: event }));
      }
    }
  };

  // Handle event resolution
  const handleEventResolution = (outcome: EventOutcome) => {
    if (outcome.success) {
      if (outcome.damage > 0) {
        soundManager.playSound(SoundType.EXPLOSION);
      }
    } else {
      soundManager.playSound(SoundType.EXPLOSION);
    }

    setGameState(prev => {
      const newState = { ...prev };
      
      // Apply credit changes
      newState.credits = Math.max(0, newState.credits - outcome.creditsCost);
      
      // Apply fuel cost
      if (outcome.fuelCost > 0) {
        newState.fuel = Math.max(0, newState.fuel - outcome.fuelCost);
      }
      
      // Apply damage to ship health
      if (outcome.damage > 0) {
        newState.health = Math.max(0, newState.health - outcome.damage);
      }
      
      // Apply cargo loss if any
      if (outcome.cargoLost) {
        Object.keys(newState.inventory).forEach(type => {
          const amount = newState.inventory[type as keyof typeof newState.inventory] || 0;
          newState.inventory[type as keyof typeof newState.inventory] = 
            Math.max(0, amount - Math.floor(amount * (outcome.cargoLost?.amount || 0) / 100));
        });
      }
      
      // Clear the current event
      newState.currentEvent = null;
      
      console.log("Event outcome applied:", {
        credits: outcome.creditsCost > 0 ? `-${outcome.creditsCost}` : `+${-outcome.creditsCost}`,
        fuel: outcome.fuelCost > 0 ? `-${outcome.fuelCost}` : "no change",
        health: outcome.damage > 0 ? `-${outcome.damage}` : "no change",
        cargo: outcome.cargoLost ? `Lost ${outcome.cargoLost.amount}%` : "no change"
      });
      
      return newState;
    });

    // Update parent component with new values
    if (setPlayerStats) {
      setPlayerStats(prev => {
        const usedCargo = Object.values(gameState.inventory).reduce((a, b) => a + b, 0);
        
        return {
          ...prev,
          credits: Math.max(0, prev.credits - outcome.creditsCost),
          health: Math.max(0, prev.health - outcome.damage),
          fuel: Math.max(0, prev.fuel - (outcome.fuelCost || 0)),
          cargoSpace: {
            ...prev.cargoSpace,
            used: Math.max(0, usedCargo - (outcome.cargoLost ? Math.floor(usedCargo * outcome.cargoLost.amount / 100) : 0))
          }
        };
      });
    }
  };

  // Function to consume fuel during travel
  const consumeFuel = (distance: number) => {
    // Calculate fuel consumption based on distance
    // Let's say 1 unit of distance costs 0.5 units of fuel
    const fuelCost = Math.ceil(distance * 0.5);
    
    setGameState(prev => {
      const newState = { ...prev };
      newState.fuel = Math.max(0, newState.fuel - fuelCost);
      
      console.log(`Consumed ${fuelCost} fuel for traveling ${distance.toFixed(1)} units`);
      
      // Handle running out of fuel
      if (newState.fuel <= 0) {
        soundManager.playSound(SoundType.ALERT);
        console.log("WARNING: Running out of fuel!");
      }
      
      return newState;
    });
    
    // Update parent component's fuel value
    if (setPlayerStats) {
      setPlayerStats(prev => ({
        ...prev,
        fuel: Math.max(0, prev.fuel - fuelCost)
      }));
    }
    
    return fuelCost;
  };

  // Add mission generation
  const generateNewMission = () => {
    const availableLocations = celestialBodiesRef.current;
    if (availableLocations.length === 0) return;

    const selectedPlanet = selectedPlanet || availableLocations[0];
    const mission = generateMission(selectedPlanet, availableLocations);

    setGameState(prev => ({
      ...prev,
      missions: [...prev.missions, mission]
    }));
  };

  // Modify the top level handleClick function to be a function declaration instead of const
  function handleClick(event: MouseEvent) {
    event.preventDefault();
    
    if (!cameraRef.current || !rendererRef.current) return;

    const rect = rendererRef.current.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const planetMeshes = celestialBodiesRef.current.flatMap(body => 
      body.mesh.children.filter(child => child.name === 'planet')
    );

    const intersects = raycaster.intersectObjects(planetMeshes, false);

    if (intersects.length > 0) {
      soundManager.playSound(SoundType.BUTTON_CLICK);
      const planetMesh = intersects[0].object;
      const planetGroup = planetMesh.parent;
      
      if (planetGroup) {
        const clickedPlanet = celestialBodiesRef.current.find(
          body => body.mesh === planetGroup
        );

        if (clickedPlanet) {
          console.log('Planet clicked!', clickedPlanet);
          
          // Get the player ship
          const playerShip = shipsRef.current.find(ship => ship.type === 'player');
          
          if (playerShip) {
            // Calculate distance to the clicked planet
            const targetPos = clickedPlanet.mesh.position;
            const currentPos = playerShip.mesh.position;
            const distance = currentPos.distanceTo(targetPos);
            
            // Check if we have enough fuel for this journey
            const requiredFuel = Math.ceil(distance * 0.5);
            
            if (gameState.fuel < requiredFuel) {
              // Not enough fuel!
              soundManager.playSound(SoundType.ALERT);
              console.log(`Not enough fuel for travel! Need ${requiredFuel}, have ${gameState.fuel}`);
              
              // Create a temporary message to show the user
              const message = document.createElement('div');
              message.textContent = `Not enough fuel for travel! Need ${requiredFuel}, have ${gameState.fuel}`;
              message.style.position = 'absolute';
              message.style.top = '20%';
              message.style.left = '50%';
              message.style.transform = 'translateX(-50%)';
              message.style.background = 'rgba(255, 0, 0, 0.7)';
              message.style.color = 'white';
              message.style.padding = '10px';
              message.style.borderRadius = '5px';
              message.style.zIndex = '1000';
              document.body.appendChild(message);
              
              // Remove the message after 3 seconds
              setTimeout(() => {
                document.body.removeChild(message);
              }, 3000);
              
              return; // Abort the travel
            }
            
            // Consume fuel for the journey
            consumeFuel(distance);
            
            // Set the selected planet
            setSelectedPlanet(clickedPlanet);
            
            // Show planet info only
            setShowPlanetInfo(true);
            
            // Generate random event when traveling
            checkForRandomEvent();
            
            // Log all ships to debug
            console.log('All ships:', shipsRef.current.map(s => ({type: s.type, position: s.mesh.position})));
            console.log('Found player ship:', playerShip);
            
            console.log('Setting player ship target:', clickedPlanet.planetData?.name);
            playerShip.targetPlanet = clickedPlanet;
            playerShip.isMoving = true;
            playerShip.isOrbiting = false; // Stop orbiting if already orbiting another planet
            
            console.log('Target position:', targetPos);
            
            playerShip.direction = new THREE.Vector3()
              .subVectors(targetPos, playerShip.mesh.position)
              .normalize();
            console.log('Player ship direction:', playerShip.direction);
            
            playerShip.mesh.lookAt(targetPos);
            // Add immediate movement to ensure the ship starts moving
            const moveDistance = playerShip.speed * 0.5;
            playerShip.mesh.position.add(playerShip.direction.clone().multiplyScalar(moveDistance));
          } else {
            console.error('Player ship not found in shipsRef!');
          }
        }
      }
    }
  }

  // Initialize sound system
  useEffect(() => {
    soundManager.init();
    soundManager.playMusic(SoundType.AMBIENT_SPACE);
    soundManager.playSound(SoundType.ENGINE_HUM);
    
    return () => {
      // Cleanup sounds when component unmounts
      soundManager.stopSound(SoundType.ENGINE_HUM);
      soundManager.stopSound(SoundType.AMBIENT_SPACE);
    };
  }, []);

  // Update engine sound based on ship speed
  useEffect(() => {
    const playerShip = shipsRef.current.find(ship => ship.type === 'player');
    if (playerShip && playerShip.isMoving) {
      const speed = playerShip.speed;
      soundManager.setEngineSound(speed);
    }
  }, [shipsRef.current]);

  // Make sure ships are visible and positioned correctly
  useEffect(() => {
    // Force position update for all ships to ensure visibility
    shipsRef.current.forEach(ship => {
      if (ship.type === 'player') {
        // Ensure player ship is in a better visible position
        ship.mesh.position.set(0, 0, 60);
      } else if (ship.type === 'pirate') {
        // Position pirates in visible locations
        const randomOffset = Math.random() * 30 + 20;
        const randomAngle = Math.random() * Math.PI * 2;
        ship.mesh.position.set(
          Math.cos(randomAngle) * randomOffset,
          0,
          Math.sin(randomAngle) * randomOffset
        );
      } else if (ship.type === 'police') {
        // Position police in visible locations
        const randomOffset = Math.random() * 50 + 40;
        const randomAngle = Math.random() * Math.PI * 2;
        ship.mesh.position.set(
          Math.cos(randomAngle) * randomOffset,
          0,
          Math.sin(randomAngle) * randomOffset
        );
      }
      
      // Make sure all ships are visible and at y=0
      ship.mesh.visible = true;
      ship.mesh.position.y = 0;
      
      // Make ships orbit a bit if not moving
      if (!ship.isMoving && ship.type !== 'player') {
        ship.isOrbiting = true;
        ship.orbitAngle = Math.random() * Math.PI * 2;
      }
    });
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000510);
    sceneRef.current = scene;

    // Camera setup with improved positioning
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    // Position the camera higher up and back to see the ships better
    camera.position.set(0, 80, 150);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup with improved shadows
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls with improved limits
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 30;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 1.5;

    // Enhanced Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 2, 1000);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 1000;
    scene.add(sunLight);

    // Create Enhanced Sun
    const sunGeometry = new THREE.SphereGeometry(15, 64, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd00,
      emissive: 0xffdd00,
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    
    // Add sun glow
    const sunGlow = new THREE.PointLight(0xffdd00, 1.5, 300);
    sun.add(sunGlow);
    
    scene.add(sun);

    // Create planets with textures, atmospheres and data
    const createPlanet = (radius: number, color: number, orbitRadius: number, orbitSpeed: number, data?: CelestialBody['planetData']): CelestialBody => {
      const group = new THREE.Group();

      // Planet mesh with improved geometry
      const geometry = new THREE.SphereGeometry(radius, 64, 64);
      
      // Create more realistic planet materials with texture-like patterns
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness: 0.3,
        emissive: new THREE.Color(color).multiplyScalar(0.1),
      });
      
      // Add bump map pattern based on planet color
      const bumpScale = (Math.random() * 0.04) + 0.01;
      const bumpStrength = Math.random() > 0.5 ? 1 : -1;
      
      // Create dynamic planet surface pattern with noise
      const size = 64;
      const bumpData = new Uint8Array(size * size * 4);
      
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const stride = (i * size + j) * 4;
          
          // Different noise patterns based on planet type
          const noise = Math.sin(i * bumpScale * bumpStrength) * Math.cos(j * bumpScale * bumpStrength) * 20 + 
                        Math.random() * 15;
          
          const val = Math.floor(128 + noise);
          bumpData[stride] = val;
          bumpData[stride + 1] = val;
          bumpData[stride + 2] = val;
          bumpData[stride + 3] = 255;
        }
      }
      
      // Create a DataTexture for the bump map
      const bumpTexture = new THREE.DataTexture(bumpData, size, size, THREE.RGBAFormat);
      bumpTexture.needsUpdate = true;
      material.bumpMap = bumpTexture;
      material.bumpScale = 0.2;
      
      const planetMesh = new THREE.Mesh(geometry, material);
      planetMesh.castShadow = true;
      planetMesh.receiveShadow = true;
      planetMesh.name = 'planet';
      
      // Add enhanced atmosphere effect with rim lighting
      const atmosphereGeometry = new THREE.SphereGeometry(radius * 1.2, 64, 64);
      const atmosphereMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(color).multiplyScalar(1.5),
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
      });
      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      atmosphere.name = 'atmosphere';
      
      // Add a second, thinner atmosphere layer for better visual effect
      const outerAtmosphereGeometry = new THREE.SphereGeometry(radius * 1.3, 32, 32);
      const outerAtmosphereMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(color).multiplyScalar(1.2),
        transparent: true,
        opacity: 0.05,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
      });
      const outerAtmosphere = new THREE.Mesh(outerAtmosphereGeometry, outerAtmosphereMaterial);
      outerAtmosphere.name = 'outer-atmosphere';
      
      // Add selection indicator (initially hidden)
      const selectionRingGeometry = new THREE.TorusGeometry(radius * 1.5, 0.2, 16, 100);
      const selectionMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff, 
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      const selectionRing = new THREE.Mesh(selectionRingGeometry, selectionMaterial);
      selectionRing.rotation.x = Math.PI / 2;
      selectionRing.visible = false;
      selectionRing.name = 'selection-ring';
      
      group.add(planetMesh);
      group.add(atmosphere);
      group.add(outerAtmosphere);
      group.add(selectionRing);
      scene.add(group);

      return {
        mesh: group,
        orbitRadius,
        orbitSpeed,
        rotationSpeed: Math.random() * 0.001 + 0.0005,
        planetData: data
      };
    };

    // Create and add the player ship explicitly with better positioning and detection
    const playerShipGroup = new THREE.Group();
    // Create a distinct and highly visible ship shape
    const shipBody = new THREE.ConeGeometry(3, 10, 16);
    const shipMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000, // Bright red for high visibility
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x550000,
      emissiveIntensity: 0.8,
    });
    const shipMesh = new THREE.Mesh(shipBody, shipMaterial);
    shipMesh.rotation.x = Math.PI / 2;
    
    // Add wings for better visibility
    const wingGeometry = new THREE.BoxGeometry(8, 0.8, 3);
    const wings = new THREE.Mesh(wingGeometry, shipMaterial);
    wings.position.z = -3;
    shipMesh.add(wings);
    
    // Add engine glow
    const engineGlow = new THREE.PointLight(0x00ffff, 2, 20);
    engineGlow.position.set(0, 0, -5);
    playerShipGroup.add(engineGlow);
    
    playerShipGroup.add(shipMesh);
    
    // Position the ship in clearly visible area
    playerShipGroup.position.set(0, 0, 60);
    
    if (sceneRef.current) {
      sceneRef.current.add(playerShipGroup);
      console.log("Player ship added to scene:", playerShipGroup);
    }
    
    // Initialize the ships array with the player ship at index 0
    const playerShip: Ship = {
      mesh: playerShipGroup,
      speed: 0.5,
      direction: new THREE.Vector3(0, 0, 1),
      type: 'player',
      isMoving: false,
      isOrbiting: false,
      orbitAngle: 0,
      orbitRadius: 8
    };
    
    // Initialize the ships reference
    shipsRef.current = [playerShip];
    
    // Log current ships for debugging
    console.log("Player ship added to ships array:", shipsRef.current);
    
    // Create enhanced ships with better details
    const createShip = (type: Ship['type'], position: THREE.Vector3): Ship => {
      const group = new THREE.Group();
      
      if (type === 'player') {
        // Create a more visible ship that doesn't rely on SVG loading
        const shipBody = new THREE.ConeGeometry(3, 10, 16);
        const shipMaterial = new THREE.MeshStandardMaterial({
          color: 0xff0000, // Bright red for high visibility
          metalness: 0.8,
          roughness: 0.2,
          emissive: 0x550000,
          emissiveIntensity: 0.8,
        });
        const shipMesh = new THREE.Mesh(shipBody, shipMaterial);
        shipMesh.rotation.x = Math.PI / 2;
        
        // Add wings for better visibility
        const wingGeometry = new THREE.BoxGeometry(8, 0.8, 3);
        const wings = new THREE.Mesh(wingGeometry, shipMaterial);
        wings.position.z = -3;
        shipMesh.add(wings);
        
        group.add(shipMesh);
        
        // Add engine glow
        const engineGlowGeometry = new THREE.ConeGeometry(1, 3, 16);
        const engineGlowMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
        });
        
        const engineGlow = new THREE.Mesh(engineGlowGeometry, engineGlowMaterial);
        engineGlow.position.set(0, 0, -5);
        engineGlow.rotation.x = Math.PI / 2;
        group.add(engineGlow);
        
        // Add engine light
        const engineLight = new THREE.PointLight(0x00ffff, 2, 20);
        engineLight.position.set(0, 0, -5);
        group.add(engineLight);
      } else if (type === 'trader') {
        // Create distinct trader ship - bulkier with cargo containers
        // Main body - wider and more rectangular for a freighter look
        const bodyGeometry = new THREE.BoxGeometry(4, 2, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
          color: 0x6688cc,
          roughness: 0.4,
          metalness: 0.6,
          emissive: 0x2244aa,
          emissiveIntensity: 0.3,
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        group.add(body);
        
        // Add cargo containers
        const cargoGeometry = new THREE.BoxGeometry(6, 1.5, 3);
        const cargoMaterial = new THREE.MeshStandardMaterial({
          color: 0xddbb44,
          roughness: 0.5,
          metalness: 0.4,
        });
        const cargo = new THREE.Mesh(cargoGeometry, cargoMaterial);
        cargo.position.z = 2;
        cargo.castShadow = true;
        group.add(cargo);
        
        // Add a bridge/cockpit
        const cockpitGeometry = new THREE.SphereGeometry(1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpitMaterial = new THREE.MeshStandardMaterial({
          color: 0x88aadd,
          transparent: true,
          opacity: 0.7,
          metalness: 0.9,
          roughness: 0.1,
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.z = -3;
        cockpit.position.y = 1;
        cockpit.rotation.x = -Math.PI / 2;
        group.add(cockpit);

        // Add engine glow
        const engineGlowGeometry = new THREE.CylinderGeometry(1, 0.6, 2, 16);
        const engineGlowMaterial = new THREE.MeshBasicMaterial({
          color: 0x44aaff,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
        });
        
        // Add two engines for the trader
        const engineLeft = new THREE.Mesh(engineGlowGeometry, engineGlowMaterial);
        engineLeft.position.set(-1.5, 0, -4);
        engineLeft.rotation.x = Math.PI / 2;
        group.add(engineLeft);
        
        const engineRight = new THREE.Mesh(engineGlowGeometry, engineGlowMaterial);
        engineRight.position.set(1.5, 0, -4);
        engineRight.rotation.x = Math.PI / 2;
        group.add(engineRight);
        
        // Add engine lights
        const engineLightLeft = new THREE.PointLight(0x44aaff, 1.5, 15);
        engineLightLeft.position.set(-1.5, 0, -5);
        group.add(engineLightLeft);
        
        const engineLightRight = new THREE.PointLight(0x44aaff, 1.5, 15);
        engineLightRight.position.set(1.5, 0, -5);
        group.add(engineLightRight);
      } else {
        // Enhanced pirate and police ships
        const bodyGeometry = new THREE.ConeGeometry(1.5, 6, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
          color: type === 'pirate' ? 0xff3333 : 0x33ff33,
          roughness: 0.3,
          metalness: 0.8,
          emissive: type === 'pirate' ? 0xff0000 : 0x00ff00,
          emissiveIntensity: 0.4,
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2;
        body.castShadow = true;
        group.add(body);

        // More detailed wings
        const wingGeometry = new THREE.BoxGeometry(4, 0.3, 2);
        const wings = new THREE.Mesh(wingGeometry, bodyMaterial);
        wings.position.z = -1;
        wings.castShadow = true;
        group.add(wings);
        
        // Add wing details
        const wingDetailGeometry = new THREE.BoxGeometry(1, 0.4, 0.8);
        const leftDetail = new THREE.Mesh(wingDetailGeometry, bodyMaterial);
        leftDetail.position.set(-2, 0, 0);
        wings.add(leftDetail);
        
        const rightDetail = new THREE.Mesh(wingDetailGeometry, bodyMaterial);
        rightDetail.position.set(2, 0, 0);
        wings.add(rightDetail);

        // Enhanced engine glow
        const engineGlowGeometry = new THREE.ConeGeometry(0.7, 1.5, 16);
        const engineGlowMaterial = new THREE.MeshBasicMaterial({
          color: type === 'pirate' ? 0xff3300 : 0x33ff00,
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending,
        });
        const engineGlow = new THREE.Mesh(engineGlowGeometry, engineGlowMaterial);
        engineGlow.position.z = -3;
        engineGlow.rotation.x = -Math.PI / 2;
        group.add(engineGlow);

        const engineLight = new THREE.PointLight(
          type === 'pirate' ? 0xff3300 : 0x33ff00,
          1,
          6
        );
        engineLight.position.z = -2;
        group.add(engineLight);
      }

      group.position.copy(position);
      scene.add(group);

      return {
        mesh: group,
        speed: type === 'player' ? 0.5 : 
               type === 'trader' ? 0.2 + Math.random() * 0.1 : // Traders are slower
               0.3 + Math.random() * 0.2,
        direction: new THREE.Vector3(0, 0, 1),
        type,
        isMoving: type === 'trader', // Traders start with movement
        isOrbiting: false,
        orbitAngle: Math.random() * Math.PI * 2,
        orbitRadius: type === 'player' ? 8 : 
                     type === 'trader' ? 20 + Math.random() * 15 : // Traders orbit further out
                     15 + Math.random() * 10
      };
    };

    // Create function to add orbit path
    const addOrbitPath = (planet: CelestialBody, radius: number, color: number = 0xffffff) => {
      // Create an orbit path to visualize the ship's orbit
      const orbitGeometry = new THREE.BufferGeometry();
      const orbitMaterial = new THREE.LineBasicMaterial({ 
        color, 
        transparent: true, 
        opacity: 0.3,
        linewidth: 1 
      });
      
      // Create circular path with many segments for smoothness
      const segments = 64;
      const points = [];
      
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;
        points.push(new THREE.Vector3(x, 0, z));
      }
      
      orbitGeometry.setFromPoints(points);
      const orbitPath = new THREE.Line(orbitGeometry, orbitMaterial);
      orbitPath.name = 'orbit-path';
      planet.mesh.add(orbitPath);
      
      return orbitPath;
    };
    
    // Function to update orbit path visibility and size
    const updateOrbitPath = (ship: Ship) => {
      if (!ship.targetPlanet) return;
      
      // Look for existing orbit path
      const existingPath = ship.targetPlanet.mesh.children.find(child => 
        child.name === 'orbit-path'
      );
      
      if (ship.isOrbiting) {
        const orbitRadius = ship.orbitRadius || 8;
        const orbitColor = ship.type === 'player' ? 0x00ffff : 
                           ship.type === 'pirate' ? 0xff3300 : 0x33ff00;
                           
        if (!existingPath) {
          // Add a new orbit path
          addOrbitPath(ship.targetPlanet, orbitRadius, orbitColor);
        } else if (existingPath instanceof THREE.Line) {
          // Update existing path
          existingPath.visible = true;
          
          // Update orbit path if radius has changed significantly
          const currentRadius = existingPath.geometry.boundingSphere?.radius || 0;
          if (Math.abs(currentRadius - orbitRadius) > 0.5) {
            ship.targetPlanet.mesh.remove(existingPath);
            addOrbitPath(ship.targetPlanet, orbitRadius, orbitColor);
          }
        }
      } else if (existingPath) {
        // Hide orbit path if ship is not orbiting
        existingPath.visible = false;
      }
    };

    // Add enhanced planets to the scene with better spacing, slower speeds, and planet data
    celestialBodiesRef.current = [
      createPlanet(3, 0x888888, 40, 0.00015, {
        name: "Mercuria",
        type: "Mining Colony",
        resources: [
          { type: "Metals", abundance: 85 },
          { type: "Technology", abundance: 20 },
          { type: "Water", abundance: 10 }
        ],
        description: "A small, scorched mining outpost close to the central star. Rich in mineral deposits but harsh living conditions.",
        population: 2500000,
        government: "Corporate Mining Consortium"
      }),
      createPlanet(4, 0xffaa88, 60, 0.00012, {
        name: "Nova Terra",
        type: "Industrial World",
        resources: [
          { type: "Metals", abundance: 65 },
          { type: "Technology", abundance: 60 },
          { type: "Food", abundance: 30 },
          { type: "LuxuryGoods", abundance: 25 }
        ],
        description: "A densely populated industrial planet shrouded in clouds of acidic vapor. Major manufacturing hub.",
        population: 3800000000,
        government: "Industrial Oligarchy"
      }),
      createPlanet(4.5, 0x4444ff, 80, 0.0001, {
        name: "Aquaria",
        type: "Ocean World",
        resources: [
          { type: "Water", abundance: 95 },
          { type: "Food", abundance: 80 },
          { type: "Technology", abundance: 40 },
          { type: "Contraband", abundance: 15 }
        ],
        description: "A vibrant water world with floating cities and underwater habitats. Known for its rich aquatic ecosystems.",
        population: 1200000000,
        government: "Maritime Republic"
      }),
      createPlanet(3.5, 0xff4444, 100, 0.00008, {
        name: "Rubidia",
        type: "Desert World",
        resources: [
          { type: "Metals", abundance: 70 },
          { type: "LuxuryGoods", abundance: 20 },
          { type: "Contraband", abundance: 45 }
        ],
        description: "A red, dusty world with scattered settlements and hidden outlaw bases in its vast canyons.",
        population: 500000000,
        government: "Frontier Coalition"
      }),
      createPlanet(8, 0xffbb88, 140, 0.00005, {
        name: "Gargantua",
        type: "Gas Giant",
        resources: [
          { type: "Food", abundance: 10 },
          { type: "Technology", abundance: 65 },
          { type: "Contraband", abundance: 25 }
        ],
        description: "A massive gas giant with floating research stations and harvesting platforms in its upper atmosphere.",
        population: 85000000,
        government: "Research Directorate"
      }),
      createPlanet(7, 0xffcc88, 180, 0.00003, {
        name: "Aurelion",
        type: "Ringed World",
        resources: [
          { type: "LuxuryGoods", abundance: 90 },
          { type: "Technology", abundance: 75 },
          { type: "Metals", abundance: 40 },
          { type: "Contraband", abundance: 60 }
        ],
        description: "A majestic ringed planet known for its luxury resorts and exclusive orbital casinos. Popular among the wealthy.",
        population: 2500000000,
        government: "Corporate Aristocracy"
      }),
      // Add more planets with diverse characteristics
      createPlanet(2.5, 0x22cc88, 220, 0.00004, {
        name: "Viridis",
        type: "Jungle World",
        resources: [
          { type: "Food", abundance: 95 },
          { type: "Contraband", abundance: 70 },
          { type: "Water", abundance: 75 }
        ],
        description: "A lush jungle planet with massive biodomes and botanical research facilities. Known for rare medicinal plants.",
        population: 340000000,
        government: "Scientific Council"
      }),
      createPlanet(5.2, 0xaabbcc, 260, 0.00002, {
        name: "Glacius",
        type: "Ice World",
        resources: [
          { type: "Water", abundance: 100 },
          { type: "Technology", abundance: 55 },
          { type: "Metals", abundance: 35 }
        ],
        description: "A frozen world with vast ice sheets and underground thermal colonies. Research outposts study ancient ice core samples.",
        population: 120000000,
        government: "Technocracy"
      }),
      createPlanet(3.8, 0x996633, 300, 0.00003, {
        name: "Terrafirma",
        type: "Agricultural World",
        resources: [
          { type: "Food", abundance: 90 },
          { type: "LuxuryGoods", abundance: 40 },
          { type: "Water", abundance: 60 }
        ],
        description: "A fertile planet with rolling plains and vast farms. The breadbasket of this sector, supplying food to many worlds.",
        population: 1800000000,
        government: "Agrarian Republic"
      }),
      createPlanet(6.5, 0x333333, 340, 0.00001, {
        name: "Umbra",
        type: "Shadow World",
        resources: [
          { type: "Metals", abundance: 85 },
          { type: "Technology", abundance: 80 },
          { type: "Contraband", abundance: 95 }
        ],
        description: "A dark planet orbiting at the edge of the system. Black markets and secret research facilities thrive in its perpetual twilight.",
        population: 250000000,
        government: "Shadow Syndicate"
      })
    ];

    // Add ships to the scene with better initial positions
    const enemyShips = [
      createShip('pirate', new THREE.Vector3(40, 0, 40)),
      createShip('pirate', new THREE.Vector3(-40, 0, -40)),
      createShip('police', new THREE.Vector3(80, 0, -80)),
      createShip('police', new THREE.Vector3(-80, 0, 80)),
      // Add more ships with different positions and destinations
      createShip('pirate', new THREE.Vector3(120, 0, -60)),
      createShip('pirate', new THREE.Vector3(-150, 0, 100)),
      createShip('pirate', new THREE.Vector3(90, 0, 210)),
      createShip('police', new THREE.Vector3(-200, 0, -120)),
      createShip('police', new THREE.Vector3(180, 0, 150)),
      createShip('police', new THREE.Vector3(-90, 0, -180)),
      // Add trade ships that travel between planets
      createShip('trader', new THREE.Vector3(100, 0, 100)),
      createShip('trader', new THREE.Vector3(-120, 0, -140)),
      createShip('trader', new THREE.Vector3(220, 0, -80)),
      createShip('trader', new THREE.Vector3(-180, 0, 220)),
      // Add some ships along common trade routes
      createShip('trader', new THREE.Vector3(70, 0, 130)),
      createShip('trader', new THREE.Vector3(-60, 0, 220)),
    ];
    
    // Add enemy ships to the ships reference (which already has the player ship)
    shipsRef.current = [...shipsRef.current, ...enemyShips];
    
    // Log all ships for debugging
    console.log("All ships (should include player + enemy ships):", shipsRef.current.map(s => s.type));

    // Create enhanced star field
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 12000; // Increased star count
    const positions = new Float32Array(starsCount * 3);
    const colors = new Float32Array(starsCount * 3);
    const sizes = new Float32Array(starsCount);
    const color = new THREE.Color();

    for (let i = 0; i < starsCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 2000;
      positions[i + 1] = (Math.random() - 0.5) * 2000;
      positions[i + 2] = (Math.random() - 0.5) * 2000;

      // Random star colors with more blue and white stars
      const colorType = Math.random();
      if (colorType < 0.6) {
        // White to blue-white stars (common)
        color.setHSL(0.6 + Math.random() * 0.1, 0.2 + Math.random() * 0.2, 0.7 + Math.random() * 0.3);
      } else if (colorType < 0.8) {
        // Yellow to orange stars
        color.setHSL(0.1 + Math.random() * 0.1, 0.7, 0.6 + Math.random() * 0.2);
      } else if (colorType < 0.95) {
        // Red stars
        color.setHSL(0.0 + Math.random() * 0.05, 0.9, 0.5 + Math.random() * 0.2);
      } else {
        // Blue giants (rare)
        color.setHSL(0.6 + Math.random() * 0.05, 0.9, 0.8 + Math.random() * 0.2);
      }
      
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
      
      // Varying star sizes
      const sizeIndex = i / 3;
      const sizeFactor = Math.random();
      if (sizeFactor > 0.995) {
        // Very large stars (rare)
        sizes[sizeIndex] = 3 + Math.random() * 2;
      } else if (sizeFactor > 0.85) {
        // Medium stars
        sizes[sizeIndex] = 2 + Math.random();
      } else {
        // Small stars (most common)
        sizes[sizeIndex] = 0.5 + Math.random();
      }
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starsMaterial = new THREE.PointsMaterial({
      size: 2,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Create space dust/nebula effect
    const createSpaceDust = () => {
      const dustGeometry = new THREE.BufferGeometry();
      const dustCount = 2000;
      const dustPositions = new Float32Array(dustCount * 3);
      const dustColors = new Float32Array(dustCount * 3);
      const dustSizes = new Float32Array(dustCount);
      const dustVelocities = [];
      
      for (let i = 0; i < dustCount * 3; i += 3) {
        // Position dust in a more clustered pattern to simulate nebulae
        const radius = 200 + Math.random() * 600;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        dustPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
        dustPositions[i + 1] = (Math.random() - 0.5) * 200; // Flatter distribution on y-axis
        dustPositions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
        
        // Create small clusters of dust with similar colors
        const clusterIndex = Math.floor(i / (3 * 20)); // Each cluster has ~20 particles
        const baseHue = (clusterIndex % 5) * 0.2; // 5 different base colors
        
        // Create nebula-like colors
        const nebulaDustColor = new THREE.Color();
        nebulaDustColor.setHSL(
          baseHue + Math.random() * 0.1 - 0.05, // Similar hue within cluster
          0.5 + Math.random() * 0.3,  // Medium-high saturation
          0.3 + Math.random() * 0.2   // Medium-low brightness for nebula effect
        );
        
        dustColors[i] = nebulaDustColor.r;
        dustColors[i + 1] = nebulaDustColor.g;
        dustColors[i + 2] = nebulaDustColor.b;
        
        // Larger particles for dust
        dustSizes[i / 3] = 2 + Math.random() * 4;
        
        // Add slow random movement
        dustVelocities.push({
          x: (Math.random() - 0.5) * 0.05,
          y: (Math.random() - 0.5) * 0.02,
          z: (Math.random() - 0.5) * 0.05
        });
      }
      
      dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
      dustGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
      dustGeometry.setAttribute('size', new THREE.BufferAttribute(dustSizes, 1));
      
      const dustMaterial = new THREE.PointsMaterial({
        size: 1,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false, // Prevents depth-fighting with other transparent objects
      });
      
      const dust = new THREE.Points(dustGeometry, dustMaterial);
      scene.add(dust);
      
      return { dust, velocities: dustVelocities };
    };

    const spaceDust = createSpaceDust();

    // Add click event listener
    renderer.domElement.addEventListener('click', handleClick);

    // Animation loop with improved ship movement and planet orbiting
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();

      // Update celestial bodies
      celestialBodiesRef.current.forEach((body, index) => {
        const time = performance.now() * body.orbitSpeed;
        body.mesh.position.x = Math.cos(time) * body.orbitRadius;
        body.mesh.position.z = Math.sin(time) * body.orbitRadius;
        body.mesh.rotation.y += body.rotationSpeed;
        
        // Highlight selected planet
        if (selectedPlanet === body) {
          const selectionRing = body.mesh.children.find(child => child.name === 'selection-ring');
          if (selectionRing) {
            selectionRing.visible = true;
            // Rotate selection ring
            selectionRing.rotation.z += 0.01;
          }
        } else {
          const selectionRing = body.mesh.children.find(child => child.name === 'selection-ring');
          if (selectionRing) {
            selectionRing.visible = false;
          }
        }
      });

      // Update ships with improved targeting and orbiting
      shipsRef.current.forEach((ship) => {
        if (ship.type === 'player') {
          // Debug movement state
          if (ship.isMoving && ship.targetPlanet) {
            console.log(`Player ship moving: pos=${ship.mesh.position.toArray().join(',')} target=${ship.targetPlanet.mesh.position.toArray().join(',')}`);
          }
          
          // Update engine glow based on movement
          const engineIntensity = ship.isMoving ? 1.5 : 0.7;
          
          // Find engine lights in the ship
          const engineLights = ship.mesh.children.filter(
            child => child instanceof THREE.PointLight && child.position.z < -1
          );
          
          engineLights.forEach(light => {
            if (light instanceof THREE.PointLight) {
              light.intensity = engineIntensity;
            }
          });
          
          // Pulse effect
          const pulseLight = ship.mesh.children.find(
            child => child instanceof THREE.PointLight && child.userData && child.userData.hasOwnProperty('pulse')
          );
          
          if (pulseLight && pulseLight instanceof THREE.PointLight) {
            pulseLight.userData.pulse += 0.05;
            pulseLight.intensity = 0.3 + Math.sin(pulseLight.userData.pulse) * 0.2;
          }
          
          if (ship.targetPlanet && ship.isMoving) {
            // Get current target position (accounting for planet orbit)
            const targetPos = ship.targetPlanet.mesh.position.clone();
            
            // Calculate direction to target
            const direction = new THREE.Vector3()
              .subVectors(targetPos, ship.mesh.position)
              .normalize();
            
            // Move towards target
            const moveDistance = ship.speed;
            ship.mesh.position.add(direction.multiplyScalar(moveDistance));
            
            // Update ship rotation to face movement direction
            ship.mesh.lookAt(targetPos);
            
            // Check if we've reached the target
            const distance = ship.mesh.position.distanceTo(targetPos);
            console.log(`Distance to target: ${distance}`);
            
            if (distance < 8) {
              console.log('Reached target! Starting orbit');
              ship.isMoving = false;
              ship.isOrbiting = true;
              // Set orbit radius based on distance from planet center (plus a buffer)
              ship.orbitRadius = Math.max(distance, 8);
              ship.orbitAngle = Math.atan2(
                ship.mesh.position.z - targetPos.z,
                ship.mesh.position.x - targetPos.x
              );
              
              // Vary the orbit height slightly for the player ship
              ship.mesh.position.y = 2 + Math.random() * 2;
              
              // Add orbit path visualization
              updateOrbitPath(ship);
            }
          } else if (ship.targetPlanet && ship.isOrbiting) {
            // Update orbit position around planet
            const planetPos = ship.targetPlanet.mesh.position;
            ship.orbitAngle! += 0.005;
            
            // Calculate new position in orbit
            const orbitRadius = ship.orbitRadius || 8; // Default orbit radius if not set
            const orbitX = Math.cos(ship.orbitAngle!) * orbitRadius;
            const orbitZ = Math.sin(ship.orbitAngle!) * orbitRadius;
            
            // Keep ship at its current height (y position) during orbit
            // if not set, use a default height
            if (ship.mesh.position.y === 0) {
              ship.mesh.position.y = 2 + Math.random() * 2;
            }
            
            // Update ship position relative to planet
            ship.mesh.position.x = planetPos.x + orbitX;
            ship.mesh.position.z = planetPos.z + orbitZ;
            
            // Make ship face tangent to orbit
            const tangentPoint = new THREE.Vector3(
              planetPos.x + Math.cos(ship.orbitAngle! + Math.PI/2) * orbitRadius,
              ship.mesh.position.y,
              planetPos.z + Math.sin(ship.orbitAngle! + Math.PI/2) * orbitRadius
            );
            ship.mesh.lookAt(tangentPoint);
            
            // Ensure orbit path is visible
            updateOrbitPath(ship);
          }
        } else if (ship.type === 'trader') {
          // Special behavior for trader ships - they move between planets
          
          // Update engine effects for trader ships
          const engineLights = ship.mesh.children.filter(
            child => child instanceof THREE.PointLight
          );
          
          // Pulsing engine effect for traders
          engineLights.forEach(light => {
            if (light instanceof THREE.PointLight) {
              light.intensity = 0.8 + Math.sin(performance.now() * 0.003) * 0.3;
            }
          });
          
          // If the trader has no target or has reached its destination, pick a new random planet
          if (!ship.targetPlanet || 
              (ship.isOrbiting && Math.random() < 0.001)) { // Chance to depart on each frame
            
            // Choose a random planet as the new destination
            const availablePlanets = celestialBodiesRef.current;
            
            if (availablePlanets.length > 0) {
              // Don't pick the current planet
              const otherPlanets = availablePlanets.filter(planet => planet !== ship.targetPlanet);
              
              if (otherPlanets.length > 0) {
                const randomPlanet = otherPlanets[Math.floor(Math.random() * otherPlanets.length)];
                
                // Set new destination
                ship.targetPlanet = randomPlanet;
                ship.isOrbiting = false;
                ship.isMoving = true;
                
                // Add slight y-axis variation for visual interest
                ship.mesh.position.y = 2 + Math.random() * 5;
                
                // Calculate direction to new target
                const targetPos = ship.targetPlanet.mesh.position.clone();
                ship.direction = new THREE.Vector3()
                  .subVectors(targetPos, ship.mesh.position)
                  .normalize();
                  
                // Update ship rotation to face movement direction
                ship.mesh.lookAt(targetPos);
                
                // Increase engine brightness when starting a journey
                engineLights.forEach(light => {
                  if (light instanceof THREE.PointLight) {
                    light.intensity = 2.0;
                  }
                });
              }
            }
          }
          
          if (ship.targetPlanet && ship.isMoving) {
            // Get current target position (accounting for planet orbit)
            const targetPos = ship.targetPlanet.mesh.position.clone();
            
            // Calculate direction to target
            const direction = new THREE.Vector3()
              .subVectors(targetPos, ship.mesh.position)
              .normalize();
            
            // Update stored direction (smoothly)
            ship.direction.lerp(direction, 0.05);
            
            // Move towards target
            const moveDistance = ship.speed;
            ship.mesh.position.add(ship.direction.clone().multiplyScalar(moveDistance));
            
            // Update ship rotation to face movement direction
            ship.mesh.lookAt(ship.mesh.position.clone().add(ship.direction));
            
            // Check if we've reached the target
            const distance = ship.mesh.position.distanceTo(targetPos);
            
            if (distance < 20) {
              ship.isMoving = false;
              ship.isOrbiting = true;
              // Set orbit radius and angle
              ship.orbitRadius = 20 + Math.random() * 5;
              ship.orbitAngle = Math.atan2(
                ship.mesh.position.z - targetPos.z,
                ship.mesh.position.x - targetPos.x
              );
            }
          } else if (ship.targetPlanet && ship.isOrbiting) {
            // Update orbit position around planet
            const planetPos = ship.targetPlanet.mesh.position;
            ship.orbitAngle! += 0.002; // Slower orbit for traders
            
            // Calculate new position in orbit
            const orbitRadius = ship.orbitRadius || 20; 
            const orbitX = Math.cos(ship.orbitAngle!) * orbitRadius;
            const orbitZ = Math.sin(ship.orbitAngle!) * orbitRadius;
            
            // Update ship position relative to planet
            ship.mesh.position.x = planetPos.x + orbitX;
            ship.mesh.position.z = planetPos.z + orbitZ;
            
            // Make ship face tangent to orbit
            const tangentPoint = new THREE.Vector3(
              planetPos.x + Math.cos(ship.orbitAngle! + Math.PI/2) * orbitRadius,
              ship.mesh.position.y,
              planetPos.z + Math.sin(ship.orbitAngle! + Math.PI/2) * orbitRadius
            );
            ship.mesh.lookAt(tangentPoint);
          }
        } else if (ship.type !== 'player') {
          // AI ship behavior with improved orbiting

          // Check if ship is near a planet
          if (!ship.isOrbiting || !ship.targetPlanet) {
            // Find closest planet
            let closestPlanet = null;
            let closestDistance = Infinity;
            
            celestialBodiesRef.current.forEach(planet => {
              const distance = ship.mesh.position.distanceTo(planet.mesh.position);
              if (distance < closestDistance && distance < 30) {
                closestDistance = distance;
                closestPlanet = planet;
              }
            });
            
            // If a planet is nearby, start orbiting
            if (closestPlanet) {
              ship.isOrbiting = true;
              ship.targetPlanet = closestPlanet;
              ship.orbitRadius = closestDistance;
              ship.orbitAngle = Math.atan2(
                ship.mesh.position.z - closestPlanet.mesh.position.z,
                ship.mesh.position.x - closestPlanet.mesh.position.x
              );
              
              // Set a different orbit height for each ship type
              if (ship.type === 'pirate') {
                // Pirates orbit lower
                ship.mesh.position.y = 1 + Math.random() * 2;
              } else if (ship.type === 'police') {
                // Police orbit higher
                ship.mesh.position.y = 3 + Math.random() * 3;
              }
              
              // Add orbit path visualization for AI ships too
              updateOrbitPath(ship);
            }
          }
          
          if (ship.isOrbiting && ship.targetPlanet) {
            // Update orbit position around planet
            const planetPos = ship.targetPlanet.mesh.position;
            
            // Different orbit speeds based on ship type
            const orbitSpeed = ship.type === 'pirate' ? 0.01 : 0.006;
            ship.orbitAngle! += orbitSpeed;
            
            // Calculate new position in orbit
            const orbitRadius = ship.orbitRadius || 15;
            const orbitX = Math.cos(ship.orbitAngle!) * orbitRadius;
            const orbitZ = Math.sin(ship.orbitAngle!) * orbitRadius;
            
            // Keep the ship at its current height during orbiting
            // If height not set, initialize it based on ship type
            if (ship.mesh.position.y === 0) {
              if (ship.type === 'pirate') {
                ship.mesh.position.y = 1 + Math.random() * 2;
              } else if (ship.type === 'police') {
                ship.mesh.position.y = 3 + Math.random() * 3;
              }
            }
            
            // Update ship position relative to planet
            ship.mesh.position.x = planetPos.x + orbitX;
            ship.mesh.position.z = planetPos.z + orbitZ;
            
            // Make ship face tangent to orbit
            const tangentPoint = new THREE.Vector3(
              planetPos.x + Math.cos(ship.orbitAngle! + Math.PI/2) * orbitRadius,
              ship.mesh.position.y,
              planetPos.z + Math.sin(ship.orbitAngle! + Math.PI/2) * orbitRadius
            );
            ship.mesh.lookAt(tangentPoint);
            
            // Update orbit path visualization
            updateOrbitPath(ship);
            
            // Police and pirate ships occasionally leave orbit to patrol or attack
            if (Math.random() < 0.0005) { // Small chance to leave orbit
              ship.isOrbiting = false;
              ship.targetPlanet = null;
              
              // Pick random direction
              ship.direction = new THREE.Vector3(
                Math.random() * 2 - 1,
                0,
                Math.random() * 2 - 1
              ).normalize();
              
              // Point ship in new direction
              ship.mesh.lookAt(ship.mesh.position.clone().add(ship.direction));
            }
          } else {
            // Regular movement if not orbiting
            // Check if we should pick a new planet randomly
            if (Math.random() < 0.002 && celestialBodiesRef.current.length > 0) {
              // Select random planet to move toward
              const randomPlanet = celestialBodiesRef.current[
                Math.floor(Math.random() * celestialBodiesRef.current.length)
              ];
              
              // Set target and start moving
              ship.targetPlanet = randomPlanet;
              ship.isOrbiting = false;
              ship.isMoving = true;
              
              // Calculate direction to target
              const targetPos = randomPlanet.mesh.position.clone();
              ship.direction = new THREE.Vector3()
                .subVectors(targetPos, ship.mesh.position)
                .normalize();
              
              // Update ship rotation
              ship.mesh.lookAt(targetPos);
            } else {
              // Random movement
              ship.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.01);
              const movement = ship.direction.clone().multiplyScalar(ship.speed * 0.2);
              ship.mesh.position.add(movement);
              ship.mesh.lookAt(ship.mesh.position.clone().add(ship.direction));
            }
            
            // Engine glow effect for AI ships
            const engineLight = ship.mesh.children.find(
              child => child instanceof THREE.PointLight && child.position.z < -1
            );
            
            if (engineLight && engineLight instanceof THREE.PointLight) {
              engineLight.intensity = 0.5 + Math.random() * 0.3;
            }
            
            // Keep AI ships within bounds with smoother transition
            const distance = ship.mesh.position.length();
            if (distance > 200) {
              ship.direction.lerp(
                new THREE.Vector3().subVectors(
                  new THREE.Vector3(0, 0, 0), 
                  ship.mesh.position
                ).normalize(),
                0.1
              );
            }
          }
        }
      });

      // Animate space dust
      if (spaceDust && spaceDust.dust) {
        const positions = spaceDust.dust.geometry.attributes.position.array;
        const velocities = spaceDust.velocities;
        
        // Update each dust particle position
        for (let i = 0; i < positions.length / 3; i++) {
          const idx = i * 3;
          
          // Apply velocity
          positions[idx] += velocities[i].x;
          positions[idx + 1] += velocities[i].y;
          positions[idx + 2] += velocities[i].z;
          
          // Add swirling motion effect
          const distance = Math.sqrt(
            positions[idx] * positions[idx] + 
            positions[idx + 2] * positions[idx + 2]
          );
          
          // Stronger swirl near the center
          const swirlFactor = Math.max(0.1, Math.min(1, 200 / distance)) * 0.001;
          
          // Apply swirl (rotation around y-axis)
          const angle = swirlFactor;
          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);
          
          const x = positions[idx];
          const z = positions[idx + 2];
          
          positions[idx] = x * cosA - z * sinA;
          positions[idx + 2] = x * sinA + z * cosA;
          
          // Keep dust within bounds
          const maxDistance = 1000;
          const currentDistance = Math.sqrt(
            positions[idx] * positions[idx] + 
            positions[idx + 1] * positions[idx + 1] + 
            positions[idx + 2] * positions[idx + 2]
          );
          
          if (currentDistance > maxDistance) {
            // Reset position to a random location closer to center
            const resetRadius = 200 + Math.random() * 300;
            const resetTheta = Math.random() * Math.PI * 2;
            const resetPhi = Math.acos(2 * Math.random() - 1);
            
            positions[idx] = resetRadius * Math.sin(resetPhi) * Math.cos(resetTheta);
            positions[idx + 1] = (Math.random() - 0.5) * 200;
            positions[idx + 2] = resetRadius * Math.sin(resetPhi) * Math.sin(resetTheta);
            
            // Reset velocity in a new direction
            velocities[i].x = (Math.random() - 0.5) * 0.05;
            velocities[i].y = (Math.random() - 0.5) * 0.02;
            velocities[i].z = (Math.random() - 0.5) * 0.05;
          }
        }
        
        // Notify Three.js that positions have been updated
        spaceDust.dust.geometry.attributes.position.needsUpdate = true;
        
        // Slowly rotate the entire dust cloud for additional motion
        spaceDust.dust.rotation.y += 0.0001;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      renderer.domElement.removeEventListener('click', handleClick);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      window.removeEventListener('resize', handleResize);
      if (sceneRef.current) {
        sceneRef.current.remove(playerShipGroup);
      }
    };
  }, []);

  // Update when trading interface is shown or closed
  useEffect(() => {
    if (showTrading) {
      console.log("Trading interface opened");
      soundManager.playSound(SoundType.MENU_OPEN);
      soundManager.playMusic(SoundType.TRADING_MUSIC);
    } else {
      console.log("Trading interface closed");
    }
  }, [showTrading]);

  return (
    <>
      <div ref={mountRef} className={styles.sceneContainer} />
      
      <AnimatePresence>
        {showPlanetInfo && selectedPlanet?.planetData && (
          <PlanetInfo
            name={selectedPlanet.planetData.name}
            type={selectedPlanet.planetData.type}
            resources={selectedPlanet.planetData.resources}
            description={selectedPlanet.planetData.description}
            population={selectedPlanet.planetData.population}
            government={selectedPlanet.planetData.government}
            distance={selectedPlanet.orbitRadius / 20} // Convert orbit radius to "light years"
            onClose={() => {
              console.log("Planet info close button clicked");
              setShowPlanetInfo(false);
              soundManager.playSound(SoundType.MENU_CLOSE);
            }}
            onTrade={() => {
              console.log("Planet info trade button clicked");
              setShowTrading(true);
              soundManager.playSound(SoundType.MENU_OPEN);
              soundManager.playMusic(SoundType.TRADING_MUSIC);
            }}
          />
        )}
      </AnimatePresence>
      
      {showTrading && (
        <TradingInterface
          player={{
            credits: gameState.credits,
            inventory: gameState.inventory,
            cargoCapacity: 100
          }}
          onTrade={handleTrade}
          onClose={() => {
            console.log("Trading interface close button clicked");
            setShowTrading(false);
            setShowPlanetInfo(false);
            soundManager.playSound(SoundType.MENU_CLOSE);
            soundManager.playMusic(SoundType.AMBIENT_SPACE);
          }}
        />
      )}
      
      {gameState.currentEvent && (
        <EventDialog
          event={gameState.currentEvent}
          playerStats={{
            attack: gameState.playerStats.attack,
            defense: gameState.playerStats.defense,
            escapeChance: gameState.playerStats.speed / 100
          }}
          distance={100}
          cargoValue={Object.entries(gameState.inventory).reduce((total, [type, amount]) => {
            const resource = gameState.marketData[type as keyof typeof gameState.marketData];
            return total + (resource ? resource.basePrice * amount : 0);
          }, 0)}
          onResolve={(outcome) => {
            handleEventResolution(outcome);
            soundManager.playMusic(SoundType.AMBIENT_SPACE);
          }}
        />
      )}

      {/* Close button overlay for keyboard access */}
      {(showTrading || showPlanetInfo) && (
        <div className="fixed top-4 right-4 z-50">
          <button 
            onClick={() => {
              setShowTrading(false);
              setShowPlanetInfo(false);
              soundManager.playSound(SoundType.MENU_CLOSE);
              soundManager.playMusic(SoundType.AMBIENT_SPACE);
            }}
            className="bg-gray-800 text-white rounded-full w-10 h-10 flex items-center justify-center 
                     border border-gray-600 hover:bg-gray-700 focus:outline-none"
            aria-label="Close interfaces"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}; 