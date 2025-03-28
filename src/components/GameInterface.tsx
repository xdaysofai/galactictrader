import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './GameInterface.module.css';

interface GameInterfaceProps {
  onStartGame: () => void;
}

export const GameInterface: React.FC<GameInterfaceProps> = ({ onStartGame }) => {
  const [showInstructions, setShowInstructions] = useState(false);

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
          <button 
            className={styles.howToPlayButton}
            onClick={() => setShowInstructions(true)}
          >
            How to Play
          </button>
          <button className={styles.optionsButton}>
            Options
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {showInstructions && (
          <motion.div 
            className={styles.instructionsOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInstructions(false)}
          >
            <motion.div 
              className={styles.instructionsModal}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className={styles.instructionsTitle}>How to Play Galactic Trader</h2>
              
              <div className={styles.instructionsContent}>
                <section className={styles.instructionSection}>
                  <h3>Game Objective</h3>
                  <p>Become the most successful trader in the galaxy by buying low, selling high, and completing profitable missions across the cosmos.</p>
                </section>

                <section className={styles.instructionSection}>
                  <h3>Core Mechanics</h3>
                  <ul>
                    <li><span className={styles.mechanic}>Trading:</span> Visit different planets to buy and sell resources. Prices vary based on supply and demand.</li>
                    <li><span className={styles.mechanic}>Space Travel:</span> Navigate between planets, consuming fuel with each journey.</li>
                    <li><span className={styles.mechanic}>Ship Management:</span> Upgrade your ship's components to improve performance and cargo capacity.</li>
                    <li><span className={styles.mechanic}>Missions:</span> Accept missions from the mission board to earn credits and reputation.</li>
                    <li><span className={styles.mechanic}>Risk Management:</span> Balance high-risk, high-reward opportunities with safer ventures.</li>
                  </ul>
                </section>

                <section className={styles.instructionSection}>
                  <h3>Controls</h3>
                  <ul>
                    <li><span className={styles.control}>Click on Planets:</span> Select a destination to travel to</li>
                    <li><span className={styles.control}>HUD Buttons:</span> Access trading, ship management, and missions</li>
                    <li><span className={styles.control}>ESC:</span> Open settings menu</li>
                  </ul>
                </section>

                <section className={styles.instructionSection}>
                  <h3>Tips for New Traders</h3>
                  <ul>
                    <li>Start with safe, legal cargo before risking contraband</li>
                    <li>Always maintain enough fuel for your return journey</li>
                    <li>Upgrade your cargo capacity early for more profitable runs</li>
                    <li>Watch for price differences between planets to maximize profits</li>
                  </ul>
                </section>
              </div>

              <button 
                className={styles.closeButton}
                onClick={() => setShowInstructions(false)}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 