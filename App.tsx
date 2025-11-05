import React from 'react';
import { useGameLogic } from './hooks/useGameLogic';
import GameBoard from './components/GameBoard';
import GamePanel from './components/GamePanel';
import VictoryModal from './components/VictoryModal';
import { GameState } from './types';

function App() {
  const {
    gameState,
    playerPositions,
    diceValues,
    isRolling,
    snakes,
    ladders,
    gameMessage,
    startGame,
    rollDice,
    resetBoard,
    returnToMenu,
    currentPlayer,
    boardTheme,
    numberOfPlayers,
    setNumberOfPlayers,
  } = useGameLogic();

  return (
    <div className="min-h-screen bg-gray-200 text-gray-800 flex flex-col items-center justify-center p-4 lg:p-8 font-sans">
      <main className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center lg:items-start gap-8">
        <div className="w-full lg:flex-1">
            <GameBoard 
                playerPositions={playerPositions}
                snakes={snakes}
                ladders={ladders}
                currentPlayer={currentPlayer}
                boardTheme={boardTheme}
            />
        </div>
        <div className="w-full lg:w-auto">
            <GamePanel 
                gameState={gameState}
                diceValues={diceValues}
                isRolling={isRolling}
                gameMessage={gameMessage}
                onStartGame={startGame}
                onRollDice={rollDice}
                onResetBoard={resetBoard}
                onReturnToMenu={returnToMenu}
                currentPlayer={currentPlayer}
                numberOfPlayers={numberOfPlayers}
                onSetNumberOfPlayers={setNumberOfPlayers}
            />
        </div>
      </main>
      
      <VictoryModal 
        isOpen={gameState === GameState.Finished}
        winner={currentPlayer}
        onPlayAgain={startGame}
        onReturnToMenu={returnToMenu}
      />
    </div>
  );
}

export default App;