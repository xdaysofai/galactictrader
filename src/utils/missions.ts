import { v4 as uuidv4 } from 'uuid';
import { CelestialBody, ResourceTypeValues } from '@/types/galaxy';
import {
  Mission,
  MissionType,
  MissionObjective,
  MISSION_TEMPLATES,
  MissionLog,
} from '@/types/missions';

const RESOURCE_TYPES: ResourceTypeValues[] = [
  'metals',
  'water',
  'food',
  'technology',
  'luxuryGoods',
  'contraband',
];

export const generateMission = (
  location: CelestialBody,
  availableLocations: CelestialBody[],
  playerReputation: number = 0
): Mission => {
  const missionTypes = Object.keys(MISSION_TEMPLATES) as MissionType[];
  const type = missionTypes[Math.floor(Math.random() * missionTypes.length)];
  const template = MISSION_TEMPLATES[type];
  
  // Select a random target location different from current
  const targetLocation = availableLocations.find(l => l.id !== location.id) || availableLocations[0];
  
  // Calculate distance-based reward
  const distance = calculateDistance(location.position, targetLocation.position);
  const baseReward = template.baseReward * (1 + distance / 100);
  
  // Generate risk level based on distance and mission type
  const riskLevel = Math.min(3, Math.ceil((distance / 50 + Math.random()) * template.riskMultiplier)) as 1 | 2 | 3;
  
  // Calculate final reward including risk bonus
  const finalReward = Math.round(baseReward * (1 + (riskLevel - 1) * 0.5));

  const objectives = generateObjectives(type, targetLocation.id);

  return {
    id: uuidv4(),
    title: generateMissionTitle(type, targetLocation.name),
    type,
    description: generateMissionDescription(type, targetLocation.name, objectives),
    giver: generateGiverName(),
    location: location.id,
    objectives,
    reward: {
      credits: finalReward,
      reputation: riskLevel * 5,
    },
    status: 'available',
    timeLimit: Math.round(distance * template.timeMultiplier),
    riskLevel,
    requiredReputation: riskLevel > 2 ? (riskLevel - 2) * 10 : 0,
    completionProgress: 0,
    expiryTime: Date.now() + 1000 * 60 * 60 * 24, // 24 hours in real time
  };
};

export const generateMissionsForLocation = (
  location: CelestialBody,
  availableLocations: CelestialBody[],
  playerReputation: number = 0,
  count: number = 3
): Mission[] => {
  return Array.from({ length: count }, () =>
    generateMission(location, availableLocations, playerReputation)
  );
};

export const updateMissionProgress = (
  mission: Mission,
  currentLocation: string,
  inventory: Record<ResourceTypeValues, number>
): Mission => {
  if (mission.status !== 'active') return mission;

  let progress = 0;
  let objectivesCompleted = 0;

  for (const objective of mission.objectives) {
    switch (objective.type) {
      case 'deliver':
        if (
          currentLocation === objective.targetLocation &&
          inventory[objective.resource!] >= objective.amount!
        ) {
          objectivesCompleted++;
        }
        break;
      case 'collect':
        if (inventory[objective.resource!] >= objective.amount!) {
          objectivesCompleted++;
        }
        break;
      // Add more objective type checks as needed
    }
  }

  progress = Math.round((objectivesCompleted / mission.objectives.length) * 100);

  return {
    ...mission,
    completionProgress: progress,
    status: progress === 100 ? 'completed' : mission.status,
  };
};

export const updateMissionLog = (
  missionLog: MissionLog,
  mission: Mission,
  action: 'accept' | 'complete' | 'fail'
): MissionLog => {
  const newLog = { ...missionLog };

  switch (action) {
    case 'accept':
      newLog.activeMissions = [...newLog.activeMissions, { ...mission, status: 'active' }];
      break;
    case 'complete':
      newLog.activeMissions = newLog.activeMissions.filter(m => m.id !== mission.id);
      newLog.completedMissions = [...newLog.completedMissions, { ...mission, status: 'completed' }];
      break;
    case 'fail':
      newLog.activeMissions = newLog.activeMissions.filter(m => m.id !== mission.id);
      newLog.failedMissions = [...newLog.failedMissions, { ...mission, status: 'failed' }];
      break;
  }

  return newLog;
};

// Helper functions
const calculateDistance = (pos1: number[], pos2: number[]): number => {
  return Math.sqrt(
    pos1.reduce((sum, coord, i) => sum + Math.pow(coord - pos2[i], 2), 0)
  );
};

const generateObjectives = (type: MissionType, targetLocationId: string): MissionObjective[] => {
  switch (type) {
    case 'delivery':
    case 'smuggling':
      const resource = type === 'smuggling' ? 'contraband' : RESOURCE_TYPES[Math.floor(Math.random() * (RESOURCE_TYPES.length - 1))];
      return [{
        type: 'deliver',
        resource,
        amount: Math.floor(Math.random() * 20) + 5,
        targetLocation: targetLocationId,
        description: `Deliver ${resource} to the specified location`,
      }];
    case 'bounty':
      return [{
        type: 'eliminate',
        targetLocation: targetLocationId,
        description: 'Eliminate the target',
      }];
    case 'trade':
      const buyResource = RESOURCE_TYPES[Math.floor(Math.random() * (RESOURCE_TYPES.length - 1))];
      return [
        {
          type: 'collect',
          resource: buyResource,
          amount: Math.floor(Math.random() * 15) + 5,
          description: `Purchase ${buyResource}`,
        },
        {
          type: 'deliver',
          resource: buyResource,
          amount: Math.floor(Math.random() * 15) + 5,
          targetLocation: targetLocationId,
          description: `Deliver ${buyResource} to the specified location`,
        },
      ];
  }
};

const generateMissionTitle = (type: MissionType, targetName: string): string => {
  const templates = {
    delivery: [`Urgent Delivery to ${targetName}`, `Transport Needed: ${targetName}`, `Priority Cargo to ${targetName}`],
    smuggling: [`Discreet Package to ${targetName}`, `Silent Run to ${targetName}`, `No Questions Asked: ${targetName}`],
    bounty: [`Wanted in ${targetName}`, `Target Spotted: ${targetName}`, `Elimination Contract: ${targetName}`],
    trade: [`Market Run: ${targetName}`, `Trade Opportunity: ${targetName}`, `Profitable Venture: ${targetName}`],
  };

  const options = templates[type];
  return options[Math.floor(Math.random() * options.length)];
};

const generateMissionDescription = (type: MissionType, targetName: string, objectives: MissionObjective[]): string => {
  const objectiveDescriptions = objectives.map(obj => obj.description).join(' and ');
  return `${MISSION_TEMPLATES[type].description} ${objectiveDescriptions} in ${targetName}.`;
};

const generateGiverName = (): string => {
  const firstNames = ['Captain', 'Agent', 'Merchant', 'Commander', 'Broker'];
  const lastNames = ['Smith', 'Chen', 'Kumar', 'Rodriguez', 'Petrov'];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}; 