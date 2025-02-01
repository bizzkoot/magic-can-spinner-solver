import { isValidMove, moveVertical, rotateRow } from './move.js';
import { serializeState, calculateHeuristic, getTargetColumnForBead } from './utils.js';

async function findSolution(state, getSimplifiedState, validatePuzzleState, isGoalState, findEmptyPosition, PriorityQueue, debugState) {
    const startState = getSimplifiedState();
    const MAX_NODES = 10000000;
    const PROGRESS_INTERVAL = 5000;  // Log progress every 5 seconds

    let nodesExplored = 0;
    let lastProgressLog = Date.now();

    console.log('Starting A* search...');
    console.log('Initial state:', serializeState(startState));

    const openSet = new PriorityQueue();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const startKey = serializeState(startState);
    gScore.set(startKey, 0);
    fScore.set(startKey, calculateHeuristic(startState));
    openSet.enqueue({
        state: startState,
        key: startKey,
        cost: 0,
        heuristic: fScore.get(startKey),
        moves: []
    });

    while (!openSet.isEmpty() && nodesExplored < MAX_NODES) {
        const current = openSet.dequeue();
        nodesExplored++;

        if (isGoalState(current.state)) {
            return current.moves;
        }

        const moves = getSmartMoves(current.state, findEmptyPosition(current.state), validatePuzzleState);
        for (const move of moves) {
            const nextState = move.apply(JSON.parse(JSON.stringify(current.state)));
            const nextKey = serializeState(nextState);
            const tentativeGScore = gScore.get(current.key) + 1;

            if (!gScore.has(nextKey) || tentativeGScore < gScore.get(nextKey)) {
                cameFrom.set(nextKey, current);
                gScore.set(nextKey, tentativeGScore);
                const h = calculateHeuristic(nextState);
                fScore.set(nextKey, tentativeGScore + h);

                openSet.enqueue({
                    state: nextState,
                    key: nextKey,
                    cost: tentativeGScore,
                    heuristic: h,
                    moves: [...current.moves, move.move]
                });
            }
        }

        if (Date.now() - lastProgressLog > PROGRESS_INTERVAL) {
            const currentScore = calculateHeuristic(current.state);
            console.log(
                `A* progress:\n` +
                `- Nodes explored: ${nodesExplored}\n` +
                `- Current heuristic score: ${currentScore}\n` +
                `- Current state: ${serializeState(current.state)}`
            );
            lastProgressLog = Date.now();
        }
    }

    // Main A* loop
    console.log('Falling back to BFS search...');
    return await bfsSearch(startState, MAX_NODES, isGoalState, getSmartMoves, serializeState, findEmptyPosition, validatePuzzleState, debugState);
}

async function depthLimitedSearch(state, depthLimit, visited, nodesExplored, maxNodes, isGoalState, getSmartMoves, serializeState, findEmptyPosition, calculateHeuristic, moveLeadsToTarget, calculateBeadDistances) {
    const stack = [{
        state: state,
        moves: [],
        depth: 0
    }];

    while (stack.length > 0 && nodesExplored < maxNodes) {
        const current = stack.pop();
        nodesExplored++;

        if (isGoalState(current.state)) {
            return { found: true, moves: current.moves };
        }

        if (current.depth >= depthLimit) continue;

        const serialized = serializeState(current.state);
        if (visited.has(serialized)) continue;
        visited.add(serialized);

        // Get possible moves and sort by heuristic
        const emptyPos = findEmptyPosition(current.state);
        const moves = getSmartMoves(current.state, emptyPos)
            .filter(move => {
                // Prune moves that move beads away from target columns
                const newState = move.apply(JSON.parse(JSON.stringify(current.state)));
                return calculateHeuristic(newState) <= calculateHeuristic(current.state);
            });

        // Sort moves by heuristic value (best moves first)
        const sortedMoves = moves.map(move => ({
            move,
            heuristic: calculateHeuristic(move.apply(current.state)) +
                // Prioritize moves that reach target columns
                (moveLeadsToTarget(move.apply(current.state), move.move) ? -100 : 0) +
                calculateBeadDistances(move.apply(current.state))
        })).sort((a, b) => a.heuristic - b.heuristic);

        // Add moves to stack in reverse order (best moves will be popped first)
        for (const {move} of sortedMoves.reverse()) {
            stack.push({
                state: move.apply(current.state),
                moves: [...current.moves, move.move],
                depth: current.depth + 1
            });
        }

        if (nodesExplored % 1000 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
            console.log(`Explored ${nodesExplored} nodes at depth ${current.depth}`);
        }
    }

    return {
        found: false,
        nodeLimit: nodesExplored >= maxNodes,
        nodesExplored
    };
}

async function bfsSearch(startState, maxNodes, isGoalState, getSmartMoves, serializeState, findEmptyPosition, validatePuzzleState, debugState) {
    const queue = [{ state: startState, moves: [] }];
    const visited = new Set();
    const moveCounter = { count: 0 };
    let nodesExplored = 0;

    while (queue.length > 0 && nodesExplored < maxNodes) {
        const current = queue.shift();
        nodesExplored++;

        // Check if we've found a solution
        if (isGoalState(current.state)) {
            console.log(`BFS found solution after exploring ${nodesExplored} states.`);
            // Number the moves sequentially
            return current.moves.map(move => ({
                ...move,
                moveNumber: ++moveCounter.count
            }));
        }

        const serialized = serializeState(current.state);
        if (visited.has(serialized)) continue;
        visited.add(serialized);

        // Get all possible moves from current state
        const emptyPos = findEmptyPosition(current.state);
        const successors = getSmartMoves(current.state, emptyPos, validatePuzzleState).map(move => {
            const newState = move.apply(current.state);
            return {
                state: newState,
                moves: [...current.moves, {
                    ...move.move,
                    stateAfter: serializeState(newState)
                }]
            };
        });

        // Add valid moves to queue
        for (const successor of successors) {
            queue.push(successor);
        }

        // Log progress periodically
        if (nodesExplored % 1000 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
            console.log(`BFS explored ${nodesExplored} states, queue size: ${queue.length}`);
        }
    }

    console.log('BFS did not find a solution within the node limit.');
    return null;
}

function generateHorizontalMoves(state, emptyPos) {
    const moves = [];
    const { col: emptyCol, row: emptyRow } = emptyPos;

    // Validate if a move is allowed according to puzzle rules
    const isValidMoveFn = (fromCol, fromRow, toCol, toRow) => {
        // Column 1 vertical moves
        if (fromCol === 0 && toCol === 0) {
            // Only allow moves between adjacent rows
            return Math.abs(fromRow - toRow) === 1;
        }

        // Horizontal moves in Row 3
        if (fromRow === 2 && toRow === 2) {
            // Only allowed when Row 4 Column 1 is empty
            if (state[0][3] === null) {
                // Must be between adjacent columns
                return Math.abs(fromCol - toCol) === 1;
            }
        }

        return false;
    };

    // Updated addMove to use isValidMoveFn
    const addMove = (move) => {
        const moveDetails = move.move;
        if (!isValidMoveFn(moveDetails.col || 0, moveDetails.from || 0,
                           moveDetails.col || 0, moveDetails.to || 0)) {
            return;
        }

        // Allow horizontal swaps between adjacent columns
        if (emptyCol > 0) {
            moves.push(createHorizontalMove(emptyCol, emptyRow, emptyCol - 1, emptyRow));
        }
        if (emptyCol < state.length - 1) {
            moves.push(createHorizontalMove(emptyCol, emptyRow, emptyCol + 1, emptyRow));
        }

        return moves;
    }
}

function moveLeadsToTarget(state, move) {
    if (move.type === 'vertical') {
        const bead = state[move.col][move.to];
        return getTargetColumnForBead(bead) === move.col;
    }
    return false;
}

function calculateBeadDistances(state) {
    return state.reduce((sum, col, colIndex) =>
        sum + col.reduce((colSum, bead, rowIndex) =>
            bead ? colSum + Math.abs(colIndex - getTargetColumnForBead(bead)) : colSum, 0), 0);
}

function createHorizontalMove(fromCol, fromRow, toCol, toRow) {
    return {
        apply: (s) => moveVertical(s, fromCol, fromRow, toCol, toRow),
        move: {
            type: 'horizontal',
            fromCol, fromRow,
            toCol, toRow
        }
    };
}

function getSmartMoves(state, emptyPos, validatePuzzleState) {
    const moves = [];
    const { col: emptyCol, row: emptyRow } = emptyPos;

    // Helper function to check if a move is valid
    const canMove = (fromCol, fromRow, toCol, toRow) => {
        // Vertical moves in column 1
        if (fromCol === 0 && toCol === 0) {
            // Only allow moves between adjacent rows
            return Math.abs(fromRow - toRow) === 1;
        }

        // Horizontal moves
        if (fromRow === toRow) {
            // Only allow horizontal moves in row 3 when row 4 of column 1 is empty
            if (fromRow === 2 && state[0][3] === null) {
                // Allow moves between adjacent columns
                if (Math.abs(fromCol - toCol) === 1) {
                    return true;
                }
            }
            return false;
        }

        return false;
    };

    const addMove = (move) => {
        if (canMove(move.move.col, move.move.from, move.move.col, move.move.to)) {
            // Only add move if it produces a valid state
            const newState = move.apply(JSON.parse(JSON.stringify(state)));
            if (newState === null) return; // Invalid move

            try {
                if (validatePuzzleState(newState)) {
                    moves.push(move);
                }
            } catch {
                // Invalid move, don't add it
            }
        }
    };

    // Vertical moves in current column
    if (emptyRow > 0) {
        addMove({
            apply: (s) => moveVertical(s, emptyCol, emptyRow, emptyCol, emptyRow - 1),
            move: { type: 'vertical', from: emptyRow - 1, to: emptyRow, col: emptyCol },
            newEmptyPos: { col: emptyCol, row: emptyRow - 1 }
        });
    }
    if (emptyRow < state[emptyCol].length - 1) {
        addMove({
            apply: (s) => moveVertical(s, emptyCol, emptyRow, emptyCol, emptyRow + 1),
            move: { type: 'vertical', from: emptyRow + 1, to: emptyRow, col: emptyCol },
            newEmptyPos: { col: emptyCol, row: emptyRow + 1 }
        });
    }

    // Horizontal moves at top level only
    if (emptyRow === 3) {
        if (emptyCol > 0) {
            addMove({
                apply: (s) => moveVertical(s, emptyCol, emptyRow, emptyCol - 1, emptyRow),
                move: { type: 'vertical', from: emptyRow, to: emptyRow, col: emptyCol - 1 },
                newEmptyPos: { col: emptyCol - 1, row: emptyRow }
            });
        }
        if (emptyCol < state.length - 1) {
            addMove({
                apply: (s) => moveVertical(s, emptyCol, emptyRow, emptyCol + 1, emptyRow),
                move: { type: 'vertical', from: emptyRow, to: emptyRow, col: emptyCol + 1 },
                newEmptyPos: { col: emptyCol + 1, row: emptyRow }
            });
        }
    }

    // Rotation moves for all rows except where empty space is
    for (let row = 0; row < 3; row++) {
        if (emptyRow !== row) {
            ['left', 'right'].forEach(dir => {
                const cloned = JSON.parse(JSON.stringify(state));
                const oldScore = calculateHeuristic(cloned);
                const newState = rotateRow(cloned, row, dir);
                const newScore = calculateHeuristic(newState);

                // Only add rotation if it improves the state
                if (newScore <= oldScore) {
                    addMove({
                        apply: (s) => rotateRow(JSON.parse(JSON.stringify(s)), row, dir),
                        move: { type: 'rotate', row, direction: dir },
                        newEmptyPos: emptyPos
                    });
                }
            });
        }
    }

    return moves;
}

export { findSolution, bfsSearch, depthLimitedSearch, getSmartMoves, generateHorizontalMoves, moveLeadsToTarget, calculateBeadDistances };
