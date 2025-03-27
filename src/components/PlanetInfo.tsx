import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './PlanetInfo.module.css';
import { soundManager, SoundType } from '@/utils/soundManager';

interface PlanetInfoProps {
  name: string;
  type: string;
  resources: {
    type: string;
    abundance: number;
  }[];
  description: string;
  population: number;
  government: string;
  distance: number;
  onClose?: () => void;
  onTrade?: () => void;
}

const PlanetInfo: React.FC<PlanetInfoProps> = ({
  name,
  type,
  resources,
  description,
  population,
  government,
  distance,
  onClose,
  onTrade
}) => {
  // Add keyboard support for ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Format population in billions/millions
  const formatPopulation = (pop: number): string => {
    if (pop >= 1000000000) {
      return `${(pop / 1000000000).toFixed(1)}B`;
    } else if (pop >= 1000000) {
      return `${(pop / 1000000).toFixed(1)}M`;
    } else if (pop >= 1000) {
      return `${(pop / 1000).toFixed(1)}K`;
    } else {
      return pop.toString();
    }
  };

  // Generate resource bar colors based on resource type
  const getResourceColor = (resourceType: string): string => {
    switch (resourceType.toLowerCase()) {
      case 'metals': return '#cc8844';
      case 'water': return '#4488ff';
      case 'food': return '#66cc66';
      case 'technology': return '#cc44cc';
      case 'luxurygoods': return '#ffcc44';
      case 'contraband': return '#ff4444';
      default: return '#aaaaaa';
    }
  };

  const handleClose = () => {
    if (onClose) {
      soundManager.playSound(SoundType.MENU_CLOSE);
      onClose();
    }
  };

  const handleTrade = () => {
    if (onTrade) {
      soundManager.playSound(SoundType.BUTTON_CLICK);
      onTrade();
    }
  };

  return (
    <motion.div 
      className={styles.planetInfo}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.header}>
        <h2 className={styles.planetName}>{name}</h2>
        <div className={styles.planetType}>{type}</div>
        {onClose && (
          <button 
            onClick={handleClose}
            className={styles.closeButton}
            aria-label="Close planet info"
          >
            ×
          </button>
        )}
      </div>
      
      <div className={styles.description}>{description}</div>
      
      <div className={styles.details}>
        <div className={styles.detailItem}>
          <span className={styles.label}>Population:</span>
          <span className={styles.value}>{formatPopulation(population)}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Government:</span>
          <span className={styles.value}>{government}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Distance:</span>
          <span className={styles.value}>{distance.toFixed(1)} LY</span>
        </div>
      </div>
      
      <div className={styles.resourcesTitle}>Available Resources</div>
      <div className={styles.resources}>
        {resources.map((resource) => (
          <div key={resource.type} className={styles.resource}>
            <div className={styles.resourceHeader}>
              <span className={styles.resourceName}>{resource.type}</span>
              <span className={styles.abundanceValue}>{resource.abundance}%</span>
            </div>
            <div className={styles.abundanceBar}>
              <div 
                className={styles.abundanceFill} 
                style={{ 
                  width: `${resource.abundance}%`,
                  backgroundColor: getResourceColor(resource.type)
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {onTrade && (
        <div className={styles.actions}>
          <button 
            onClick={handleTrade}
            className={styles.tradeButton}
          >
            Trade
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default PlanetInfo; 