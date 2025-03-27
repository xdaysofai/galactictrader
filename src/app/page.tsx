'use client';

import React, { useState, useEffect } from 'react';
import { GameInterface } from '../components/GameInterface';
import { GameScene } from '../components/GameScene';
import { GameHUD } from '../components/GameHUD';
import { loadGame } from '../utils/saveSystem';

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerStats, setPlayerStats] = useState({
    credits: 10000,
    health: 100,
    fuel: 100,
    cargoSpace: {
      used: 0,
      total: 100
    }
  });

  useEffect(() => {
    const savedGame = loadGame();
    if (savedGame) {
      setPlayerStats({
        credits: savedGame.player.credits,
        health: savedGame.health,
        fuel: savedGame.fuel,
        cargoSpace: {
          used: Object.values(savedGame.player.inventory).reduce((a, b) => a + b, 0),
          total: savedGame.player.cargoCapacity
        }
      });
    }
  }, []);

  const handleStartGame = () => {
    setGameStarted(true);
  };

  const handleStatsUpdate = (newStats: typeof playerStats) => {
    setPlayerStats(newStats);
  };

  return (
    <main>
      <GameScene setPlayerStats={setPlayerStats} />
      {!gameStarted && <GameInterface onStartGame={handleStartGame} />}
      {gameStarted && (
        <GameHUD 
          playerStats={playerStats}
          setPlayerStats={setPlayerStats}
        />
      )}
    </main>
  );
}
