import { CelestialBody, TravelCalculation, FUEL_PER_UNIT } from '@/types/galaxy';

export const calculateDistance = (
  start: [number, number, number],
  end: [number, number, number]
): number => {
  const [x1, y1, z1] = start;
  const [x2, y2, z2] = end;
  return Math.sqrt(
    Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2)
  );
};

export const calculateTravel = (
  distance: number,
  shipSpeed: number
): TravelCalculation => {
  const fuelCost = distance * FUEL_PER_UNIT;
  const travelTime = distance / shipSpeed;

  return {
    distance,
    fuelCost,
    travelTime,
  };
};

// Generate random celestial bodies for testing
export const generateGalaxy = (numBodies: number): CelestialBody[] => {
  const bodies: CelestialBody[] = [];
  const types: ('planet' | 'station')[] = ['planet', 'station'];

  for (let i = 0; i < numBodies; i++) {
    const position: [number, number, number] = [
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100,
    ];

    bodies.push({
      id: `body-${i}`,
      name: `${types[i % 2]} ${i + 1}`,
      type: types[i % 2],
      position,
    });
  }

  return bodies;
}; 