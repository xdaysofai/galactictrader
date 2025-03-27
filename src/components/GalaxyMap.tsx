import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { CelestialBody, PlayerShip } from '@/types/galaxy';

interface CelestialBodyMeshProps {
  body: CelestialBody;
  onClick: (body: CelestialBody) => void;
  isSelected: boolean;
}

const CelestialBodyMesh = ({ body, onClick, isSelected }: CelestialBodyMeshProps) => {
  const color = body.type === 'planet' ? '#4CAF50' : '#2196F3';
  const scale = body.type === 'planet' ? 1 : 0.7;

  return (
    <mesh
      position={body.position}
      onClick={(e) => {
        e.stopPropagation();
        onClick(body);
      }}
      scale={scale}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={isSelected ? '#ff0000' : color}
        emissiveIntensity={isSelected ? 0.5 : 0.2}
      />
    </mesh>
  );
};

interface GalaxyMapProps {
  bodies: CelestialBody[];
  player: PlayerShip;
  onTravel: (destination: CelestialBody) => void;
}

export default function GalaxyMap({ bodies, player, onTravel }: GalaxyMapProps) {
  const selectedBodyRef = useRef<CelestialBody | null>(null);

  const handleBodyClick = (body: CelestialBody) => {
    selectedBodyRef.current = body;
    onTravel(body);
  };

  return (
    <div className="w-full h-screen">
      <Canvas camera={{ position: [0, 20, 20], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} />
        
        {/* Player Ship */}
        <mesh position={player.position}>
          <boxGeometry args={[0.5, 0.5, 1]} />
          <meshStandardMaterial color="#FFD700" />
        </mesh>

        {/* Celestial Bodies */}
        {bodies.map((body) => (
          <CelestialBodyMesh
            key={body.id}
            body={body}
            onClick={handleBodyClick}
            isSelected={selectedBodyRef.current?.id === body.id}
          />
        ))}

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={100}
        />
      </Canvas>
    </div>
  );
} 