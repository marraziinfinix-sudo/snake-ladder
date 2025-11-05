
import { useState, useCallback, useEffect, useMemo } from 'react';
// FIX: Corrected typo in SnakesAndLadders import.
import { GameState, SnakesAndLadders, Theme, SnakeDetail } from '../types';
import { BOARD_SIZE, MIN_SNAKES, MAX_SNAKES, MIN_LADDERS, MAX_LADDERS, DICE_SIDES } from '../constants';
import { initializeAudio, playDiceRollSound, playTokenMoveSound, playSnakeSound, playLadderSound, playVictorySound } from '../utils/audio';


type Point = { x: number; y: number };
type AnimationPath = { path: number[], dice: [number, number] };

const themes: Theme[] = [
    { primary: 'bg-green-200', secondary: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', bg: 'bg-green-50' },
    { primary: 'bg-blue-200', secondary: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', bg: 'bg-blue-50' },
    { primary: 'bg-red-200', secondary: 'bg-red-100', border: 'border-red-300', text: 'text-red-800', bg: 'bg-red-50' },
    { primary: 'bg-purple-200', secondary: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', bg: 'bg-purple-50' },
    { primary: 'bg-orange-200', secondary: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', bg: 'bg-orange-50' },
    { primary: 'bg-yellow-200', secondary: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800', bg: 'bg-yellow-50' },
    { primary: 'bg-pink-200', secondary: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800', bg: 'bg-pink-50' },
];

const SNAKE_COLOR_PAIRS: [string, string][] = [
    ['#EF4444', '#F87171'], // Red
    ['#3B82F6', '#60A5FA'], // Blue
    ['#22C55E', '#4ADE80'], // Green
    ['#A855F7', '#C084FC'], // Purple
    ['#F97316', '#FB923C'], // Orange
    ['#EAB308', '#FACC15'], // Yellow
    ['#EC4899', '#F472B6'], // Pink
    ['#14B8A6', '#2DD4BF'], // Teal
];

const getRandomTheme = (currentTheme?: Theme): Theme => {
    let newTheme;
    do {
        newTheme = themes[Math.floor(Math.random() * themes.length)];
    } while (currentTheme && newTheme === currentTheme);
    return newTheme;
};


// --- Board Logic Helpers ---
const getRow = (cell: number): number => {
    if (cell <= 0 || cell > BOARD_SIZE) return -1;
    return Math.floor((cell - 1) / 10);
};

const getCol = (cell: number): number => {
    if (cell <= 0 || cell > BOARD_SIZE) return -1;
    const normalizedCell = cell - 1;
    const row = Math.floor(normalizedCell / 10);
    let col = normalizedCell % 10;
    if (row % 2 !== 0) {
      col = 9 - col;
    }
    return col;
};


// --- Geometry Helpers for Intersection Checks ---

const getCellCoordinates = (cellNumber: number, boardPixelWidth: number): Point => {
    const cellSize = boardPixelWidth / 10;
    if (cellNumber <= 0 || cellNumber > BOARD_SIZE) return { x: 0, y: 0 };

    const normalizedCell = cellNumber - 1;
    const row = Math.floor(normalizedCell / 10);
    let col = normalizedCell % 10;
    if (row % 2 !== 0) {
      col = 9 - col;
    }
    const x = col * cellSize + cellSize / 2;
    const y = (9 - row) * cellSize + cellSize / 2;
    return { x, y };
};

const onSegment = (p: Point, q: Point, r: Point): boolean => {
    return (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
            q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y));
}

const orientation = (p: Point, q: Point, r: Point): number => {
    const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (val === 0) return 0;
    return (val > 0) ? 1 : 2;
}

const doIntersect = (p1: Point, q1: Point, p2: Point, q2: Point): boolean => {
    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);

    if (o1 !== o2 && o3 !== o4) return true;
    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;

    return false;
}

const getPointOnBezier = (p0: Point, p1: Point, p2: Point, t: number): Point => {
    const x = Math.pow(1 - t, 2) * p0.x + 2 * (1 - t) * t * p1.x + Math.pow(t, 2) * p2.x;
    const y = Math.pow(1 - t, 2) * p0.y + 2 * (1 - t) * t * p1.y + Math.pow(t, 2) * p2.y;
    return { x, y };
};

const getSnakePolyline = (startCell: number, endCell: number, boardWidth: number): Array<{p1: Point, q1: Point}> => {
    const startPos = getCellCoordinates(startCell, boardWidth);
    const endPos = getCellCoordinates(endCell, boardWidth);
    const direction = (startCell + endCell) % 2 === 0 ? 0.3 : -0.3;
    const controlPos = {
        x: (startPos.x + endPos.x) / 2 + (startPos.y - endPos.y) * direction,
        y: (startPos.y + endPos.y) / 2 + (endPos.x - startPos.x) * direction
    };
    const points: Point[] = [];
    const segments = 4;
    for (let i = 0; i <= segments; i++) {
        points.push(getPointOnBezier(startPos, controlPos, endPos, i / segments));
    }
    const polyline: Array<{p1: Point, q1: Point}> = [];
    for (let i = 0; i < points.length - 1; i++) {
        polyline.push({ p1: points[i], q1: points[i+1] });
    }
    return polyline;
};

const getLadderLines = (startCell: number, endCell: number, boardWidth: number): Array<{p1: Point, q1: Point}> => {
    const startPos = getCellCoordinates(startCell, boardWidth);
    const endPos = getCellCoordinates(endCell, boardWidth);
    const halfWidth = 4;
    const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x);
    const perpAngle = angle + Math.PI / 2;
    const cosPerp = Math.cos(perpAngle);
    const sinPerp = Math.sin(perpAngle);
    const rail1 = { 
        p1: { x: startPos.x + halfWidth * cosPerp, y: startPos.y + halfWidth * sinPerp },
        q1: { x: endPos.x + halfWidth * cosPerp, y: endPos.y + halfWidth * sinPerp } 
    };
    const rail2 = { 
        p1: { x: startPos.x - halfWidth * cosPerp, y: startPos.y - halfWidth * sinPerp },
        q1: { x: endPos.x - halfWidth * cosPerp, y: endPos.y - halfWidth * sinPerp }
    };
    return [rail1, rail2];
}

const distToSegmentSquared = (p: Point, v: Point, w: Point): number => {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return (p.x - v.x) ** 2 + (p.y - v.y) ** 2;
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projection = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
    return (p.x - projection.x) ** 2 + (p.y - projection.y) ** 2;
};


// --- Custom Hook for Game Logic ---

const PLAYER_COLOR_NAMES = ['Blue', 'Red', 'Green', 'Yellow'];

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.NotStarted);
  const [numberOfPlayers, setNumberOfPlayers] = useState<number>(2);
  const [playerPositions, setPlayerPositions] = useState<number[]>([0, 0]);
  const [currentPlayer, setCurrentPlayer] = useState<number>(0);
  const [diceValues, setDiceValues] = useState<[number, number] | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [snakes, setSnakes] = useState<SnakeDetail[]>([]);
  const [ladders, setLadders] = useState<SnakesAndLadders>(new Map());
  const [gameMessage, setGameMessage] = useState<string>('Welcome! Select the number of players and click "Start Game".');
  const [animationPath, setAnimationPath] = useState<AnimationPath | null>(null);
  const [boardTheme, setBoardTheme] = useState<Theme>(() => getRandomTheme());

  const snakesAndLadders = useMemo(() => {
    const combined = new Map(ladders);
    snakes.forEach(snake => {
        combined.set(snake.start, snake.end);
    });
    return combined;
  }, [snakes, ladders]);


  const generateSnakesAndLadders = useCallback(() => {
    const numSnakes = Math.floor(Math.random() * (MAX_SNAKES - MIN_SNAKES + 1)) + MIN_SNAKES;
    const numLadders = Math.floor(Math.random() * (MAX_LADDERS - MIN_LADDERS + 1)) + MIN_LADDERS;
    
    const usedCells = new Set<number>([1, BOARD_SIZE]);
    const snakesData: Array<{ start: number; end: number; colors: [string, string]; polyline: Array<{p1: Point, q1: Point}> }> = [];
    const laddersData: Array<{ start: number; end: number; lines: Array<{p1: Point, q1: Point}> }> = [];
    const snakeHeadsPerRow = new Map<number, number>();
    const ladderBasesPerRow = new Map<number, number>();
    const snakeTailsPerRow = new Map<number, number>();
    const VIRTUAL_BOARD_WIDTH = 500;
    const MAX_TRIES = 50;

    const getRandomCell = (excludeSet: Set<number>) => {
      let cell;
      do {
        cell = Math.floor(Math.random() * (BOARD_SIZE - 2)) + 2;
      } while (excludeSet.has(cell));
      return cell;
    };
    
    // Generate Ladders first so snakes can avoid them
    for (let i = 0; i < numLadders; i++) {
      let tries = 0;
      while(tries < MAX_TRIES) {
        const start = getRandomCell(usedCells);
        const tempUsed = new Set(usedCells);
        tempUsed.add(start);
        const end = getRandomCell(tempUsed);

        const startRow = getRow(start);
        const endRow = getRow(end);

        // Ensure ladders span at least 2 rows
        if (Math.abs(startRow - endRow) < 2) {
            tries++;
            continue;
        }

        const ladderStart = Math.min(start, end);
        const ladderEnd = Math.max(start, end);

        const ladderStartRow = getRow(ladderStart);
        const basesInRow = ladderBasesPerRow.get(ladderStartRow) || 0;
        if (basesInRow >= 1) {
            tries++;
            continue;
        }

        const newLadderLines = getLadderLines(ladderStart, ladderEnd, VIRTUAL_BOARD_WIDTH);
        
        let intersects = false;
        for (const existing of laddersData) {
          for (const newLine of newLadderLines) {
            for (const existingLine of existing.lines) {
              if (doIntersect(newLine.p1, newLine.q1, existingLine.p1, existingLine.q1)) {
                intersects = true;
                break;
              }
            }
            if (intersects) break;
          }
          if (intersects) break;
        }

        if (!intersects) {
          laddersData.push({ start: ladderStart, end: ladderEnd, lines: newLadderLines });
          usedCells.add(start);
          usedCells.add(end);
          ladderBasesPerRow.set(ladderStartRow, basesInRow + 1);
          break;
        }
        tries++;
      }
    }

    // Generate Snakes
    for (let i = 0; i < numSnakes; i++) {
      let tries = 0;
      while(tries < MAX_TRIES) {
        const start = getRandomCell(usedCells);
        const tempUsed = new Set(usedCells);
        tempUsed.add(start);
        const end = getRandomCell(tempUsed);
        
        const head = Math.max(start, end);
        const tail = Math.min(start, end);
        
        const headRow = getRow(head);
        const tailRow = getRow(tail);

        // Ensure snakes span at least 2 rows
        if (Math.abs(headRow - tailRow) < 2) {
            tries++;
            continue;
        }

        const headsInRow = snakeHeadsPerRow.get(headRow) || 0;
        if (headsInRow >= 1) {
            tries++;
            continue;
        }

        const tailsInRow = snakeTailsPerRow.get(tailRow) || 0;
        if (tailsInRow >= 1) {
            tries++;
            continue;
        }

        const headCoords = getCellCoordinates(head, VIRTUAL_BOARD_WIDTH);
        const CELL_SIZE = VIRTUAL_BOARD_WIDTH / 10;
        const MIN_DISTANCE_SQUARED = (CELL_SIZE * 0.6) ** 2; 

        let isHeadOverlapping = false;
        for (const existingLadder of laddersData) {
            for (const line of existingLadder.lines) {
                if (distToSegmentSquared(headCoords, line.p1, line.q1) < MIN_DISTANCE_SQUARED) {
                    isHeadOverlapping = true;
                    break;
                }
            }
            if (isHeadOverlapping) break;
        }
         if (isHeadOverlapping) {
          tries++;
          continue;
        }
        
        for (const existingSnake of snakesData) {
          for (const segment of existingSnake.polyline) {
            if (distToSegmentSquared(headCoords, segment.p1, segment.q1) < MIN_DISTANCE_SQUARED) {
              isHeadOverlapping = true;
              break;
            }
          }
          if (isHeadOverlapping) break;
        }
        if (isHeadOverlapping) {
          tries++;
          continue;
        }

        const newSnakePolyline = getSnakePolyline(head, tail, VIRTUAL_BOARD_WIDTH);
        
        let intersects = false;
        for (const existing of snakesData) {
          for (const newSegment of newSnakePolyline) {
            for (const existingSegment of existing.polyline) {
              if (doIntersect(newSegment.p1, newSegment.q1, existingSegment.p1, existingSegment.q1)) {
                intersects = true;
                break;
              }
            }
            if (intersects) break;
          }
          if (intersects) break;
        }

        if (!intersects) {
          const colors = SNAKE_COLOR_PAIRS[Math.floor(Math.random() * SNAKE_COLOR_PAIRS.length)];
          snakesData.push({ start: head, end: tail, colors, polyline: newSnakePolyline });
          usedCells.add(start);
          usedCells.add(end);
          snakeHeadsPerRow.set(headRow, headsInRow + 1);
          snakeTailsPerRow.set(tailRow, tailsInRow + 1);
          break;
        }
        tries++;
      }
    }
    
    const finalSnakes = snakesData.map(({start, end, colors}) => ({start, end, colors}));
    const finalLadders = new Map(laddersData.map(l => [l.start, l.end]));
    
    setSnakes(finalSnakes);
    setLadders(finalLadders);

  }, []);

  const startGame = useCallback(() => {
    initializeAudio();
    generateSnakesAndLadders();
    setBoardTheme(current => getRandomTheme(current));
    setPlayerPositions(Array(numberOfPlayers).fill(0));
    setCurrentPlayer(0);
    setDiceValues(null);
    setGameState(GameState.InProgress);
    setGameMessage("Game started! It's Blue player's turn to roll the dice.");
  }, [generateSnakesAndLadders, numberOfPlayers]);

  const resetBoard = useCallback(() => {
    if (isAnimating) return;
    generateSnakesAndLadders();
    setBoardTheme(current => getRandomTheme(current));
    const colorName = PLAYER_COLOR_NAMES[currentPlayer];
    setGameMessage(`The game board has been reset! It's still ${colorName}'s turn.`);
  }, [generateSnakesAndLadders, isAnimating, currentPlayer]);

  const returnToMenu = useCallback(() => {
    setGameState(GameState.NotStarted);
    setPlayerPositions(Array(numberOfPlayers).fill(0));
    setCurrentPlayer(0);
    setDiceValues(null);
    setGameMessage('Welcome! Select the number of players and click "Start Game".');
  }, [numberOfPlayers]);

  const handlePostMove = useCallback((finalPosition: number, dice: [number, number]) => {
    const destination = snakesAndLadders.get(finalPosition);
    let landedPosition = finalPosition;
    let postMoveMessage = '';
    const colorName = PLAYER_COLOR_NAMES[currentPlayer];

    const checkTurnEnd = (pos: number) => {
        if (pos === BOARD_SIZE) {
            playVictorySound();
            setGameState(GameState.Finished);
            setGameMessage(postMoveMessage + ` Congratulations Player ${colorName}, you win!`);
        } else {
            const nextPlayer = (currentPlayer + 1) % numberOfPlayers;
            const nextPlayerColorName = PLAYER_COLOR_NAMES[nextPlayer];
            if (dice[0] !== dice[1]) {
                setCurrentPlayer(nextPlayer);
                setGameMessage(postMoveMessage + ` It's ${nextPlayerColorName}'s turn.`);
            } else {
                 setGameMessage(postMoveMessage + ` Player ${colorName} rolled doubles! Roll again.`);
            }
        }
        setIsAnimating(false);
    };
    
    if (destination !== undefined) {
      landedPosition = destination;
      const isLadder = destination > finalPosition;
      const type = isLadder ? 'ladder' : 'snake';
      postMoveMessage = `Player ${colorName} hit a ${type}! Moving from ${finalPosition} to ${destination}.`;
      
      setTimeout(() => {
        if (isLadder) {
            playLadderSound();
        } else {
            playSnakeSound();
        }
        setPlayerPositions(prev => {
          const newPositions = [...prev];
          newPositions[currentPlayer] = landedPosition;
          return newPositions;
        });
        setTimeout(() => checkTurnEnd(landedPosition), 300);
      }, 500);

    } else {
      postMoveMessage = `Player ${colorName} moves to square ${finalPosition}.`;
      checkTurnEnd(finalPosition);
    }

  }, [currentPlayer, snakesAndLadders, numberOfPlayers]);

  useEffect(() => {
    if (!animationPath || !animationPath.path.length) return;

    const [nextPos, ...restOfPath] = animationPath.path;
    
    const timer = setTimeout(() => {
      playTokenMoveSound();
      setPlayerPositions(prev => {
        const newPositions = [...prev];
        newPositions[currentPlayer] = nextPos;
        return newPositions;
      });
      
      if (restOfPath.length > 0) {
        setAnimationPath(prev => prev ? ({ ...prev, path: restOfPath }) : null);
      } else {
        handlePostMove(nextPos, animationPath.dice);
        setAnimationPath(null);
      }
    }, 200); 

    return () => clearTimeout(timer);
  }, [animationPath, currentPlayer, handlePostMove]);


  const rollDice = useCallback(() => {
    initializeAudio();
    if (isAnimating) return;
    setIsAnimating(true);
    setDiceValues(null);
    playDiceRollSound();

    setTimeout(() => {
      const d1 = Math.floor(Math.random() * DICE_SIDES) + 1;
      const d2 = Math.floor(Math.random() * DICE_SIDES) + 1;
      const totalDice = d1 + d2;
      const dice: [number, number] = [d1, d2];
      setDiceValues(dice);
      
      const currentPosition = playerPositions[currentPlayer];
      const targetPosition = currentPosition + totalDice;

      const path: number[] = [];
      if (targetPosition <= BOARD_SIZE) {
        for (let i = 1; i <= totalDice; i++) {
          path.push(currentPosition + i);
        }
      } else { // Bounce back logic
        const overshoot = targetPosition - BOARD_SIZE;
        for (let i = 1; i <= totalDice; i++) {
            if (currentPosition + i <= BOARD_SIZE) {
                path.push(currentPosition + i);
            } else {
                path.push(BOARD_SIZE - (i - (BOARD_SIZE - currentPosition)));
            }
        }
      }
      
      if (path.length > 0) {
        setAnimationPath({ path, dice });
      } else {
        // No movement, e.g., starting at 0 and rolling
        let finalPosition = currentPosition;
        if(currentPosition === 0) finalPosition = totalDice;

         setPlayerPositions(prev => {
            const newPositions = [...prev];
            newPositions[currentPlayer] = finalPosition === 0 ? totalDice : finalPosition;
            return newPositions;
        });

        setTimeout(() => {
            handlePostMove(finalPosition, dice);
        }, 300);
      }

    }, 500);
  }, [isAnimating, playerPositions, currentPlayer, handlePostMove]);

  return {
    gameState,
    playerPositions,
    diceValues,
    isRolling: isAnimating,
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
  };
};
