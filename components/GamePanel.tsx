
import React from 'react';
import { GameState } from '../types';

interface GamePanelProps {
  gameState: GameState;
  diceValues: [number, number] | null;
  isRolling: boolean;
  gameMessage: string;
  onStartGame: () => void;
  onRollDice: () => void;
  onResetBoard: () => void;
  onReturnToMenu: () => void;
  currentPlayer: number;
  numberOfPlayers: number;
  onSetNumberOfPlayers: (count: number) => void;
}

const Dice: React.FC<{ value: number | null }> = ({ value }) => {
  const dots = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [25, 75], [75, 25], [75, 75]],
    5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
    6: [[25, 25], [25, 50], [25, 75], [75, 25], [75, 50], [75, 75]],
  };

  return (
    <div className={`w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center`}>
      {value ? (
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          {dots[value as keyof typeof dots].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="8" fill="black" />
          ))}
        </svg>
      ) : (
        <span className="text-3xl">?</span>
      )}
    </div>
  );
};

const GamePanel: React.FC<GamePanelProps> = ({ gameState, diceValues, isRolling, gameMessage, onStartGame, onRollDice, onResetBoard, onReturnToMenu, currentPlayer, numberOfPlayers, onSetNumberOfPlayers }) => {
  const playerColors = ['border-blue-500', 'border-red-500', 'border-green-500', 'border-yellow-500'];
  const playerButtonClasses = [
    'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 focus:ring-blue-500', // Player 1
    'bg-red-600 hover:bg-red-700 disabled:bg-red-400 focus:ring-red-500',   // Player 2
    'bg-green-600 hover:bg-green-700 disabled:bg-green-400 focus:ring-green-500', // Player 3
    'bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 focus:ring-yellow-400', // Player 4
  ];

  return (
    <div className={`w-full lg:w-96 p-6 bg-gray-100 rounded-lg shadow-lg flex flex-col items-center justify-between space-y-6 border-t-8 ${gameState === GameState.InProgress ? playerColors[currentPlayer] : 'border-gray-300'} transition-all`}>
      <h1 className="text-3xl font-bold text-gray-800">Snakes and Ladders</h1>
      
      <div className="w-full flex flex-col items-center space-y-4">
        <div className={`flex gap-4 ${isRolling && !diceValues ? 'animate-spin' : ''}`}>
            <Dice value={diceValues ? diceValues[0] : null} />
            <Dice value={diceValues ? diceValues[1] : null} />
        </div>

        {gameState === GameState.InProgress && (
          <>
            <button
              onClick={onRollDice}
              disabled={isRolling}
              className={`w-full px-6 py-4 text-white font-bold rounded-lg shadow-md disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-opacity-50 text-lg ${playerButtonClasses[currentPlayer]}`}
            >
              {isRolling ? '...' : 'Roll Dice'}
            </button>
            <div className="w-full min-h-[4rem] bg-gray-200 rounded-lg p-3 text-center flex items-center justify-center shadow-inner">
              <p className="text-gray-700 font-medium">{gameMessage}</p>
            </div>
          </>
        )}
      </div>

      {gameState === GameState.InProgress ? (
        <div className="w-full flex flex-col gap-2">
            <div className="flex gap-2">
              <button
              onClick={onResetBoard}
              disabled={isRolling}
              className="w-full px-6 py-3 bg-yellow-500 text-white font-bold rounded-lg shadow-md hover:bg-yellow-600 disabled:bg-yellow-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 text-sm"
              >
              Reset Board
              </button>
              <button
                onClick={onStartGame}
                disabled={isRolling}
                className="w-full px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 text-sm"
              >
                Reset Game
              </button>
            </div>
            <button
              onClick={onReturnToMenu}
              disabled={isRolling}
              className="w-full px-6 py-3 bg-gray-500 text-white font-bold rounded-lg shadow-md hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 text-sm"
            >
              Select Number of Players
            </button>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-700">Select Number of Players:</h3>
            <div className="flex justify-center gap-2">
                {[1, 2, 3, 4].map((count) => (
                    <button
                        key={count}
                        onClick={() => onSetNumberOfPlayers(count)}
                        className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                        numberOfPlayers === count
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                    >
                        {count}
                    </button>
                ))}
            </div>
            <button
            onClick={onStartGame}
            className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
            {gameState === GameState.NotStarted ? 'Start Game' : 'Play Again'}
            </button>
        </div>
      )}
    </div>
  );
};

export default GamePanel;
