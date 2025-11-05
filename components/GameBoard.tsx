
import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { SnakesAndLadders, Theme, SnakeDetail } from '../types';
import { BOARD_SIZE } from '../constants';

interface GameBoardProps {
  playerPositions: number[];
  snakes: SnakeDetail[];
  ladders: SnakesAndLadders;
  currentPlayer: number;
  boardTheme: Theme;
}

type PlayerColor = 'blue' | 'red' | 'green' | 'yellow';

const TOKEN_COLORS: PlayerColor[] = ['blue', 'red', 'green', 'yellow'];

const colorMap: Record<PlayerColor, { bg: string, lightBg: string }> = {
    blue: { bg: 'bg-blue-500', lightBg: 'bg-blue-200' },
    red: { bg: 'bg-red-500', lightBg: 'bg-red-200' },
    green: { bg: 'bg-green-500', lightBg: 'bg-green-200' },
    yellow: { bg: 'bg-yellow-500', lightBg: 'bg-yellow-200' },
};

const PlayerToken: React.FC<{ position: { x: number; y: number }, color: PlayerColor, isCurrent: boolean }> = ({ position, color, isCurrent }) => {
    const { bg, lightBg } = colorMap[color];
    const ring = isCurrent ? 'ring-4 ring-yellow-400' : 'ring-0';

    return (
      <div
        className={`absolute w-8 h-8 md:w-10 md:h-10 ${bg} rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all duration-200 ease-linear ${ring}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)',
          zIndex: 20,
        }}
      >
        <div className={`w-4 h-4 md:w-5 md:h-5 ${lightBg} rounded-full`}></div>
      </div>
    );
};

const GameBoard: React.FC<GameBoardProps> = ({ playerPositions, snakes, ladders, currentPlayer, boardTheme }) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(0);

  useEffect(() => {
    const updateBoardSize = () => {
      if (boardRef.current) {
        setBoardWidth(boardRef.current.offsetWidth);
      }
    };
    updateBoardSize();
    window.addEventListener('resize', updateBoardSize);
    return () => window.removeEventListener('resize', updateBoardSize);
  }, []);

  const getCellCoordinates = useCallback((cellNumber: number) => {
    if (boardWidth === 0) return { x: 0, y: 0 };
    const cellSize = boardWidth / 10;
    
    if (cellNumber === 0) {
      // Position for player tokens below the board, under square 1
      const x_pos_cell_1 = cellSize / 2; // X-coordinate of the column for square 1
      return { x: x_pos_cell_1, y: boardWidth + cellSize / 1.5 }; // Place it below the board
    }

    const normalizedCell = cellNumber - 1;
    const row = Math.floor(normalizedCell / 10); // Logical row from the bottom (0-indexed)
    let col = normalizedCell % 10;
    if (row % 2 !== 0) { // For odd logical rows from the bottom, reverse the column
      col = 9 - col;
    }
    const x = col * cellSize + cellSize / 2;
    const y = (9 - row) * cellSize + cellSize / 2; // Y-coordinate from the top
    return { x, y };
  }, [boardWidth]);

  const playerCoords = useMemo(() => {
    const coords = playerPositions.map(pos => getCellCoordinates(pos));
    if (boardWidth === 0) return coords;

    // Group players by position
    const positionsMap = new Map<number, number[]>();
    playerPositions.forEach((pos, index) => {
        if (!positionsMap.has(pos)) {
            positionsMap.set(pos, []);
        }
        positionsMap.get(pos)!.push(index);
    });

    // Apply offset for overlapping tokens
    positionsMap.forEach((playersOnSameSquare, pos) => {
        const numPlayers = playersOnSameSquare.length;
        if (numPlayers <= 1) return;

        if (pos === 0) {
            // Linear spread in the starting area
            const cellSize = boardWidth / 10;
            const totalWidth = (numPlayers - 1) * cellSize * 0.3;
            const startX = (cellSize / 2) - (totalWidth / 2);
            playersOnSameSquare.forEach((playerIndex, i) => {
                coords[playerIndex].x = startX + i * cellSize * 0.3;
            });
        } else {
            // Circular spread on the board
            const radius = 8; // pixels
            const angleStep = (2 * Math.PI) / numPlayers;
            playersOnSameSquare.forEach((playerIndex, i) => {
                const angle = i * angleStep;
                coords[playerIndex].x += Math.cos(angle) * radius;
                coords[playerIndex].y += Math.sin(angle) * radius;
            });
        }
    });

    return coords;
  }, [playerPositions, getCellCoordinates, boardWidth]);


  const boardCells = useMemo(() => {
    const cells = [];
    // Iterate rows from top to bottom (visual rows 0-9)
    for (let visualRow = 0; visualRow < 10; visualRow++) {
      // Iterate columns from left to right (visual columns 0-9)
      for (let visualCol = 0; visualCol < 10; visualCol++) {
        const logicalRow = 9 - visualRow; // Convert visual row to logical row (0 = bottom row)
        
        let cellNumber;
        if (logicalRow % 2 === 0) { // Even logical rows (0, 2, ...) go from left to right
          cellNumber = (logicalRow * 10) + visualCol + 1;
        } else { // Odd logical rows (1, 3, ...) go from right to left
          cellNumber = (logicalRow * 10) + (10 - visualCol);
        }

        const isEvenLogicalRow = logicalRow % 2 === 0;
        const isEvenCell = cellNumber % 2 === 0;
        const bgColor = (isEvenLogicalRow && isEvenCell) || (!isEvenLogicalRow && !isEvenCell) ? boardTheme.primary : boardTheme.secondary;

        cells.push(
          <div
            key={cellNumber}
            className={`w-full h-full border ${boardTheme.border} flex items-start justify-start p-1 ${bgColor}`}
          >
            <span className={`text-xs md:text-sm font-bold ${boardTheme.text}`}>{cellNumber}</span>
          </div>
        );
      }
    }
    return cells;
  }, [boardTheme]);


  const ladderElements = useMemo(() => {
    if (boardWidth === 0) return null;
    return Array.from(ladders.entries()).map(([start, end]) => {
      const startPos = getCellCoordinates(start);
      const endPos = getCellCoordinates(end);

      const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x);
      const perpAngle = angle + Math.PI / 2;
      const offset = 5;
      const x1_1 = startPos.x + offset * Math.cos(perpAngle);
      const y1_1 = startPos.y + offset * Math.sin(perpAngle);
      const x2_1 = endPos.x + offset * Math.cos(perpAngle);
      const y2_1 = endPos.y + offset * Math.sin(perpAngle);
      const x1_2 = startPos.x - offset * Math.cos(perpAngle);
      const y1_2 = startPos.y - offset * Math.sin(perpAngle);
      const x2_2 = endPos.x - offset * Math.cos(perpAngle);
      const y2_2 = endPos.y - offset * Math.sin(perpAngle);
      
      const numRungs = Math.floor(Math.sqrt((endPos.x-startPos.x)**2 + (endPos.y-startPos.y)**2) / 15);

      return (
        <g key={`ladder-${start}`}>
          <line x1={x1_1} y1={y1_1} x2={x2_1} y2={y2_1} stroke="#8B4513" strokeWidth="5" />
          <line x1={x1_2} y1={y1_2} x2={x2_2} y2={y2_2} stroke="#8B4513" strokeWidth="5" />
          {Array.from({length: numRungs}).map((_, i) => {
            const p = (i + 1) / (numRungs + 1);
            const rung_x1 = x1_1 + p * (x2_1 - x1_1);
            const rung_y1 = y1_1 + p * (y2_1 - y1_1);
            const rung_x2 = x1_2 + p * (x2_2 - x1_2);
            const rung_y2 = y1_2 + p * (y2_2 - y1_2);
            return <line key={i} x1={rung_x1} y1={rung_y1} x2={rung_x2} y2={rung_y2} stroke="#8B4513" strokeWidth="4" />
          })}
        </g>
      );
    });
  }, [ladders, boardWidth, getCellCoordinates]);

  const snakeElements = useMemo(() => {
    if (boardWidth === 0) return null;

    return snakes.map(({ start, end, colors }) => {
      const startPos = getCellCoordinates(start);
      const endPos = getCellCoordinates(end);
      const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
      const direction = (start + end) % 2 === 0 ? 0.3 : -0.3;
      
      const rawMidX = (startPos.x + endPos.x) / 2 + (startPos.y - endPos.y) * direction;
      const rawMidY = (startPos.y + endPos.y) / 2 + (endPos.x - startPos.x) * direction;
      
      const margin = 8;
      const midX = clamp(rawMidX, margin, boardWidth - margin);
      const midY = clamp(rawMidY, margin, boardWidth - margin);
      const patternId = `pattern-snake-${start}`;

      return (
        <g key={`snake-${start}`}>
          <path d={`M ${startPos.x} ${startPos.y} Q ${midX} ${midY} ${endPos.x} ${endPos.y}`} stroke={`url(#${patternId})`} strokeWidth="10" fill="none" strokeLinecap="round" />
          <circle cx={startPos.x} cy={startPos.y} r="10" fill={colors[0]} />
          <circle cx={startPos.x-4} cy={startPos.y-4} r="2.5" fill="white" />
          <circle cx={startPos.x+4} cy={startPos.y-4} r="2.5" fill="white" />
        </g>
      );
    });
  }, [snakes, boardWidth, getCellCoordinates]);

  return (
    <div ref={boardRef} className="relative w-full aspect-square max-w-[80vh] mb-8">
        <div className={`absolute top-0 left-0 w-full h-full ${boardTheme.bg} shadow-2xl rounded-lg overflow-hidden`}>
            <div className="grid grid-cols-10 grid-rows-10 w-full h-full">
                {boardCells}
            </div>
            <svg className="absolute top-0 left-0 w-full h-full" style={{ zIndex: 10 }}>
                <defs>
                    {snakes.map(({ start, colors }) => (
                        <pattern key={`pattern-${start}`} id={`pattern-snake-${start}`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <rect width="5" height="10" fill={colors[0]} />
                            <rect x="5" width="5" height="10" fill={colors[1]} />
                        </pattern>
                    ))}
                </defs>
                {ladderElements}
                {snakeElements}
            </svg>
        </div>
        
        {boardWidth > 0 && (
            <>
                {playerPositions.map((_, index) => (
                    <PlayerToken
                        key={index}
                        position={playerCoords[index]}
                        color={TOKEN_COLORS[index % TOKEN_COLORS.length]}
                        isCurrent={currentPlayer === index}
                    />
                ))}
            </>
        )}
    </div>
  );
};

export default GameBoard;
