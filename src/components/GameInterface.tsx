import React from 'react';
import { motion } from 'framer-motion';
import styles from './GameInterface.module.css';

interface GameInterfaceProps {
  onStartGame: () => void;
}

export const GameInterface: React.FC<GameInterfaceProps> = ({ onStartGame }) => {
  return (
    <div className={styles.container}>
      <div className={styles.mainMenu}>
        <motion.h1 
          className={styles.title}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Galactic Trader
        </motion.h1>
        <motion.div 
          className={styles.buttonContainer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button 
            className={styles.startButton}
            onClick={onStartGame}
          >
            Launch Game
          </button>
          <button className={styles.optionsButton}>
            Options
          </button>
        </motion.div>
      </div>
    </div>
  );
}; 