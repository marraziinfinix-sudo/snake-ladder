
import React from 'react';

interface VictoryModalProps {
  isOpen: boolean;
  winner: number;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
}

const VictoryModal: React.FC<VictoryModalProps> = ({ isOpen, winner, onPlayAgain, onReturnToMenu }) => {
  if (!isOpen) {
    return null;
  }

  const PLAYER_COLOR_NAMES = ['Blue', 'Red', 'Green', 'Yellow'];
  const playerColors = ['text-blue-500', 'text-red-500', 'text-green-500', 'text-yellow-500'];
  const winnerColorClass = playerColors[winner] || 'text-gray-800';
  const winnerName = PLAYER_COLOR_NAMES[winner] || 'Unknown';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-2xl p-8 m-4 max-w-sm w-full text-center transform transition-all scale-100 animate-jump-in">
        <h1 className="text-5xl font-extrabold text-yellow-500 drop-shadow-lg mb-2">
          YOU WIN!!!
        </h1>
        <p className={`text-2xl font-semibold mb-6 ${winnerColorClass}`}>
          Congratulations, Player {winnerName}!
        </p>
        <div className="flex flex-col gap-4">
          <button
            onClick={onPlayAgain}
            className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 text-lg"
          >
            Play Again
          </button>
          <button
            onClick={onReturnToMenu}
            className="w-full px-6 py-3 bg-gray-500 text-white font-bold rounded-lg shadow-md hover:bg-gray-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 text-lg"
          >
            Back to Menu
          </button>
        </div>
      </div>
      <style>{`
        @keyframes jump-in {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          80% {
            transform: scale(1.05);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-jump-in {
          animation: jump-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default VictoryModal;
