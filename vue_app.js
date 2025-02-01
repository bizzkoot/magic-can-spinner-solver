import { defineComponent, reactive, onMounted, toRefs } from 'vue';
// Initial state definition - Each array represents a column, with beads from bottom to top
const INITIAL_STATE = [
    [null, 'blue', 'blue', 'blue'],      // Column 1 (has extra space at top)
    ['red', 'red', 'red'],               // Column 2
    ['yellow', 'yellow', 'yellow'],      // Column 3
    ['purple', 'purple', 'purple'],      // Column 4
    ['green', 'green', 'green'],         // Column 5
    ['orange', 'orange', 'orange']       // Column 6
];

import { stateData, resetToInitial } from './state.js';
import { isValidMove, moveVertical, rotateRow } from './move.js';
import { findSolution, bfsSearch, depthLimitedSearch, getSmartMoves, generateHorizontalMoves, moveLeadsToTarget, calculateBeadDistances } from './search.js';
import { serializeState, calculateHeuristic, getTargetColumnForBead, findEmptyPosition } from './utils.js';

// Worker code definition
const workerCode = `
    // ...existing worker code...
`;

const blob = new Blob([workerCode], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(blob);

export default defineComponent({
    name: 'PuzzleSolver',
    setup() {
        const state = reactive({
            ...stateData,
            initialState: null,
            columns: [],
            colors: ['blue', 'red', 'yellow', 'purple', 'green', 'orange'],
            solving: false,
            error: null,
            solution: [],
            quickInput: '',
            quickInputError: null
        });

        // Convert methods to composition API
        const methods = {
            isSpecialSlot(colIndex, rowIndex) {
                // Only allow empty slot in Column 1's Row 4 (index 3)
                return colIndex === 0 && rowIndex === 3;
            },

            isValidMove(fromCol, fromRow, toCol, toRow) {
                // Vertical moves only in Column 1
                if (fromCol === 0 && toCol === 0) {
                    return Math.abs(fromRow - toRow) === 1;
                }

                // Horizontal moves only at Row 3 when Column 1's Row 4 is empty
                if (fromRow === 2 && toRow === 2) {
                    if (state.columns[0].beads[3] === null) {
                        return Math.abs(fromCol - toCol) === 1;
                    }
                }
                return false;
            },

            resetToInitial() {
                resetToInitial(state);
            },

            async solvePuzzle() {
                state.solving = true;
                state.error = null;
                state.solution = [];

                try {
                    // Save initial state if not already saved
                    if (!state.initialState) {
                        state.initialState = JSON.parse(JSON.stringify(state.columns));
                    }

                    // Validate current state
                    if (!methods.validatePuzzleState()) {
                        throw new Error("Invalid puzzle state. Please check the configuration.");
                    }

                    // Find solution using A* search
                    const solution = await findSolution(state.columns, methods.getSimplifiedState, methods.validatePuzzleState, methods.isGoalState, findEmptyPosition, PriorityQueue, methods.debugState);

                    if (solution) {
                        state.solution = solution;
                    } else {
                        state.error = "No solution found!";
                    }
                } catch (error) {
                    state.error = error.message;
                } finally {
                    state.solving = false;
                }
            },

            validatePuzzleState() {
                // Add strict color count validation
                const colorCounts = {};
                state.columns.forEach(col => {
                    col.beads.forEach(bead => {
                        if (bead !== null) {
                            colorCounts[bead] = (colorCounts[bead] || 0) + 1;
                            if (colorCounts[bead] > 3) {
                                throw new Error(`Invalid state: Too many ${bead} beads (max 3)`);
                            }
                        }
                    });
                });

                // Add additional validation
                if (!state.columns[0].beads[3] && state.columns[0].beads[3] !== null) {
                    return false; // Ensure top position of first column is properly defined
                }
                // Check if exactly one empty space exists
                let emptySpaces = 0;
                state.columns.forEach(col => {
                    col.beads.forEach(bead => {
                        if (bead === null) emptySpaces++;
                    });
                });
                if (emptySpaces !== 1) return false;

                // Check if correct number of each color exists
                state.colors.forEach(color => {
                    if (color) colorCounts[color] = 0;
                });

                state.columns.forEach(col => {
                    col.beads.forEach(bead => {
                        if (bead) colorCounts[bead]++;
                    });
                });

                return Object.entries(colorCounts).every(([color, count]) => count === 3);
            },

            // Add debug method
            debugState(state, label = '') {
                console.log(`${label} State:`,
                    state.map(col => col.map(bead => bead === null ? 'null' : bead).join(',')).join('|')
                );
            },

            // Add new method for vertical moves
            moveVertical(state, fromCol, fromRow, toCol, toRow) {
                const newState = JSON.parse(JSON.stringify(state));
                // Don't allow moves to the same position
                if (fromCol === toCol && fromRow === toRow) {
                    return null;
                }
                // Swap the beads between positions
                const temp = newState[fromCol][fromRow];
                newState[fromCol][fromRow] = newState[toCol][toRow];
                newState[toCol][toRow] = temp;
                return newState;
            },

            // Add heuristic function to estimate moves needed
            // Enhanced heuristic with positional awareness
            calculateHeuristic(state) {
                let score = 0;
                for (let col = 0; col < state.length; col++) {
                    const colorCounts = {};
                    let majorityColor = null;
                    let maxCount = 0;

                    // Count colors and find majority color in this column
                    state[col].forEach(bead => {
                        if (bead !== null) {
                            colorCounts[bead] = (colorCounts[bead] || 0) + 1;
                            if (colorCounts[bead] > maxCount) {
                                maxCount = colorCounts[bead];
                                majorityColor = bead;
                            }
                        }
                    });

                    // Penalize mixed colors in the same column
                    Object.entries(colorCounts).forEach(([color, count]) => {
                        if (color !== majorityColor) {
                            score += count * 5; // Higher penalty for mixed colors
                        }
                    });
                }

                // Add small penalty for empty space not at top
                const emptyCol = state.findIndex(col => col.includes(null));
                if (emptyCol !== -1) {
                    const emptyRow = state[emptyCol].indexOf(null);
                    // Penalize if empty space is not at the top
                    if (emptyRow !== state[emptyCol].length - 1) {
                        score += (state[emptyCol].length - 1 - emptyRow) * 2;
                    }
                }

                return score;
            },

            getTargetColumnForBead(bead) {
                switch(bead) {
                    case 'blue': return 0;
                    case 'red': return 1;
                    case 'yellow': return 2;
                    case 'purple': return 3;
                    case 'green': return 4;
                    case 'orange': return 5;
                    default: return -1;
                }
            },

            // Efficient state serialization
            serializeState(state) {
                return state.map(col => col.join(',')).join('|');
            },

            // Update findSolution to use IDA* search
            // Switched to A* with priority queue
            async findSolution() {
                const startState = methods.getSimplifiedState();
                const MAX_NODES = 10000000;
                const PROGRESS_INTERVAL = 5000;  // Log progress every 5 seconds

                let nodesExplored = 0;
                let lastProgressLog = Date.now();

                console.log('Starting A* search...');
                console.log('Initial state:', methods.serializeState(startState));

                const openSet = new PriorityQueue();
                const cameFrom = new Map();
                const gScore = new Map();
                const fScore = new Map();

                const startKey = methods.serializeState(startState);
                gScore.set(startKey, 0);
                fScore.set(startKey, methods.calculateHeuristic(startState));
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

                    if (methods.isGoalState(current.state)) {
                        return current.moves;
                    }

                    const moves = methods.getSmartMoves(current.state, methods.findEmptyPosition(current.state));
                    for (const move of moves) {
                        const nextState = move.apply(JSON.parse(JSON.stringify(current.state)));
                        const nextKey = methods.serializeState(nextState);
                        const tentativeGScore = gScore.get(current.key) + 1;

                        if (!gScore.has(nextKey) || tentativeGScore < gScore.get(nextKey)) {
                            cameFrom.set(nextKey, current);
                            gScore.set(nextKey, tentativeGScore);
                            const h = methods.calculateHeuristic(nextState);
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
                        const currentScore = methods.calculateHeuristic(current.state);
                        console.log(
                            `A* progress:\n` +
                            `- Nodes explored: ${nodesExplored}\n` +
                            `- Current heuristic score: ${currentScore}\n` +
                            `- Current state: ${methods.serializeState(current.state)}`
                        );
                        lastProgressLog = Date.now();
                    }
                }

                // Main A* loop
                console.log('Falling back to BFS search...');
                return await methods.bfsSearch(startState, MAX_NODES);
            },

            async depthLimitedSearch(state, depthLimit, visited, nodesExplored, maxNodes) {
                const stack = [{
                    state: state,
                    moves: [],
                    depth: 0
                }];

                while (stack.length > 0 && nodesExplored < maxNodes) {
                    const current = stack.pop();
                    nodesExplored++;

                    if (methods.isGoalState(current.state)) {
                        return { found: true, moves: current.moves };
                    }

                    if (current.depth >= depthLimit) continue;

                    const serialized = methods.serializeState(current.state);
                    if (visited.has(serialized)) continue;
                    visited.add(serialized);

                    // Get possible moves and sort by heuristic
                    const emptyPos = methods.findEmptyPosition(current.state);
                    const moves = methods.getSmartMoves(current.state, emptyPos)
                        .filter(move => {
                            // Prune moves that move beads away from target columns
                            const newState = move.apply(JSON.parse(JSON.stringify(current.state)));
                            return methods.calculateHeuristic(newState) <= methods.calculateHeuristic(current.state);
                        });

                    // Sort moves by heuristic value (best moves first)
                    const sortedMoves = moves.map(move => ({
                        move,
                        heuristic: methods.calculateHeuristic(move.apply(current.state)) +
                            // Prioritize moves that reach target columns
                            (methods.moveLeadsToTarget(move.apply(current.state), move.move) ? -100 : 0) +
                            methods.calculateBeadDistances(move.apply(current.state))
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
            },

            async bfsSearch(startState, maxNodes) {
                const queue = [{ state: startState, moves: [] }];
                const visited = new Set();
                const moveCounter = { count: 0 };
                let nodesExplored = 0;

                while (queue.length > 0 && nodesExplored < maxNodes) {
                    const current = queue.shift();
                    nodesExplored++;

                    // Check if we've found a solution
                    if (methods.isGoalState(current.state)) {
                        console.log(`BFS found solution after exploring ${nodesExplored} states.`);
                        // Number the moves sequentially
                        return current.moves.map(move => ({
                            ...move,
                            moveNumber: ++moveCounter.count
                        }));
                    }

                    const serialized = methods.serializeState(current.state);
                    if (visited.has(serialized)) continue;
                    visited.add(serialized);

                    // Get all possible moves from current state
                    const emptyPos = methods.findEmptyPosition(current.state);
                    const successors = methods.getSmartMoves(current.state, emptyPos).map(move => {
                        const newState = move.apply(current.state);
                        return {
                            state: newState,
                            moves: [...current.moves, {
                                ...move.move,
                                stateAfter: methods.serializeState(newState)
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
            },

            // New horizontal move generator
            generateHorizontalMoves(state, emptyPos) {
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
                        moves.push(methods.createHorizontalMove(emptyCol, emptyRow, emptyCol - 1, emptyRow));
                    }
                    if (emptyCol < state.length - 1) {
                        moves.push(methods.createHorizontalMove(emptyCol, emptyRow, emptyCol + 1, emptyRow));
                    }

                    return moves;
                }
            },

            // New helper method
            moveLeadsToTarget(state, move) {
                if (move.type === 'vertical') {
                    const bead = state[move.col][move.to];
                    return methods.getTargetColumnForBead(bead) === move.col;
                }
                return false;
            },

            // New distance calculator
            calculateBeadDistances(state) {
                return state.reduce((sum, col, colIndex) =>
                    sum + col.reduce((colSum, bead, rowIndex) =>
                        bead ? colSum + Math.abs(colIndex - methods.getTargetColumnForBead(bead)) : colSum, 0), 0);
            },

            findEmptyPosition(state) {
                for (let col = 0; col < state.length; col++) {
                    const row = state[col].indexOf(null);
                    if (row !== -1) {
                        return { col, row };
                    }
                }
                return null;
            },

            getSmartMoves(state, emptyPos) {
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
                            if (methods.validatePuzzleState(newState)) {
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
                        apply: (s) => methods.moveVertical(s, emptyCol, emptyRow, emptyCol, emptyRow - 1),
                        move: { type: 'vertical', from: emptyRow - 1, to: emptyRow, col: emptyCol },
                        newEmptyPos: { col: emptyCol, row: emptyRow - 1 }
                    });
                }
                if (emptyRow < state[emptyCol].length - 1) {
                    addMove({
                        apply: (s) => methods.moveVertical(s, emptyCol, emptyRow, emptyCol, emptyRow + 1),
                        move: { type: 'vertical', from: emptyRow + 1, to: emptyRow, col: emptyCol },
                        newEmptyPos: { col: emptyCol, row: emptyRow + 1 }
                    });
                }

                // Horizontal moves at top level only
                if (emptyRow === 3) {
                    if (emptyCol > 0) {
                        addMove({
                            apply: (s) => methods.moveVertical(s, emptyCol, emptyRow, emptyCol - 1, emptyRow),
                            move: { type: 'vertical', from: emptyRow, to: emptyRow, col: emptyCol - 1 },
                            newEmptyPos: { col: emptyCol - 1, row: emptyRow }
                        });
                    }
                    if (emptyCol < state.length - 1) {
                        addMove({
                            apply: (s) => methods.moveVertical(s, emptyCol, emptyRow, emptyCol + 1, emptyRow),
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
                            const oldScore = methods.calculateHeuristic(cloned);
                            const newState = methods.rotateRow(cloned, row, dir);
                            const newScore = methods.calculateHeuristic(newState);

                            // Only add rotation if it improves the state
                            if (newScore <= oldScore) {
                                addMove({
                                    apply: (s) => methods.rotateRow(JSON.parse(JSON.stringify(s)), row, dir),
                                    move: { type: 'rotate', row, direction: dir },
                                    newEmptyPos: emptyPos
                                });
                            }
                        });
                    }
                }

                return moves;
            },

            getSimplifiedState() {
                // Convert current state to bottom-to-top order to match input format
                return state.columns.map(col => {
                    const reversed = [...col.beads].reverse();
                    // Ensure null values are properly represented
                    return reversed.map(bead => bead === null ? null : bead);
                });
            },

            // Add a new goal check:
            isGoalState(state) {
                return state.every((col, colIndex) => {
                    const beads = col.filter(bead => bead !== null); // Ignore empty space

                    // For the first column, we want exactly 3 beads and the top position empty
                    if (colIndex === 0) {
                        if (beads.length !== 3 || col[3] !== null) {
                            return false;
                        }
                    } else {
                        // For other columns, we want exactly 3 beads
                        if (beads.length !== 3) {
                            return false;
                        }
                    }

                    // All beads in the column must be the same color
                    return new Set(beads).size === 1;
                });
            },

            // New horizontal move creator
            createHorizontalMove(fromCol, fromRow, toCol, toRow) {
                return {
                    apply: (s) => methods.moveVertical(s, fromCol, fromRow, toCol, toRow),
                    move: {
                        type: 'horizontal',
                        fromCol, fromRow,
                        toCol, toRow
                    }
                };
            },

            rotateRow(state, row, direction) {
                // Convert row index from bottom-to-top to top-to-bottom
                const actualRow = state[0].length - 1 - row;

                // Get the values in the current row
                const rowValues = state.map(col => col[actualRow]);

                // Rotate the values
                if (direction === 'right') {
                    const last = rowValues.pop();
                    rowValues.unshift(last);
                } else {
                    const first = rowValues.shift();
                    rowValues.push(first);
                }

                // Update the state with rotated values and ensure null stays as null
                rowValues.forEach((value, colIndex) => {
                    state[colIndex][actualRow] = value === 'null' ? null : value;
                });

                return state;
            },

            getCurrentStateAsString() {
                if (!state.columns || !state.columns.length) return '';
                return state.columns
                    .map(col => {
                        // Reverse the beads array to show bottom-to-top order
                        const beadsBottomToTop = [...col.beads].reverse();
                        return beadsBottomToTop.map(bead => bead === null ? 'null' : bead).join(',');
                    })
                    .join('|');
            },

            copyCurrentState() {
                const stateString = methods.getCurrentStateAsString();
                if (!stateString) {
                    alert('No state to copy!');
                    return;
                }
                navigator.clipboard.writeText(stateString)
                    .then(() => alert('Current state copied to clipboard!'))
                    .catch(err => {
                        console.error('Copy failed:', err);
                        alert('Failed to copy. State string: ' + stateString);
                    });
            },

            applyQuickInput() {
                state.quickInputError = null;
                try {
                    const input = state.quickInput.trim();
                    if (!input) {
                        throw new Error('Input is empty');
                    }

                    const columns = input.split('|').map(col => ({
                        // Keep the order as-is since input is already in bottom-to-top order
                        beads: col.split(',').map(bead => {
                            const cleanBead = bead.trim();
                            return cleanBead === 'null' ? null : cleanBead;
                        })
                    }));

                    // Validation
                    if (columns.length !== 6) {
                        throw new Error('Must have exactly 6 columns');
                    }

                    // Validate column lengths and bead colors
                    const validColors = new Set(['blue', 'red', 'yellow', 'purple', 'green', 'orange', null]);
                    const colorCounts = {};

                    columns.forEach((col, colIndex) => {
                        // Check column length - first column needs 4 beads (including null), others need 3
                        const expectedLength = colIndex === 0 ? 4 : 3;
                        if (col.beads.length !== expectedLength) {
                            throw new Error(`Column ${colIndex + 1} must have ${expectedLength} ${colIndex === 0 ? '(3 beads + 1 empty space)' : 'beads'}`);
                        }

                        // For first column, ensure empty space is in the last position (top)
                        if (colIndex === 0 && col.beads[col.beads.length - 1] !== null) {
                            throw new Error('First column must have empty space in the last position (top)');
                        }

                        // For other columns, ensure no null values
                        if (colIndex > 0 && col.beads.includes(null)) {
                            throw new Error(`Column ${colIndex + 1} cannot have empty spaces`);
                        }

                        // Validate colors and count them
                        col.beads.forEach((bead, position) => {
                            if (bead !== null) {
                                if (!validColors.has(bead)) {
                                    throw new Error(`Invalid color: ${bead}`);
                                }
                                colorCounts[bead] = (colorCounts[bead] || 0) + 1;
                                if (colorCounts[bead] > 3) {
                                    throw new Error(`Too many ${bead} beads (max 3)`);
                                }
                            }
                        });
                    });

                    // Don't reverse the arrays, keep bottom-to-top order
                    state.columns = columns;
                    console.log('State updated:', methods.getCurrentStateAsString());
                } catch (error) {
                    state.quickInputError = error.message;
                    console.error('Quick input error:', error);
                }
            }
        };

        // Lifecycle hooks
        onMounted(() => {
            // Initialize columns with the initial state
            state.columns = INITIAL_STATE.map(col => ({
                beads: [...col] // Create a new array for each column
            }));
            // Store the initial state for reset functionality
            state.initialState = JSON.parse(JSON.stringify(state.columns));
            console.log('Initial state:', methods.getCurrentStateAsString());
        });

        return {
            ...toRefs(state),
            ...methods
        };
    }
});

// Add Priority Queue implementation
class PriorityQueue {
    constructor() {
        this.values = [];
    }

    enqueue(element) {
        this.values.push(element);
        this.sort();
    }

    dequeue() {
        return this.values.shift();
    }

    sort() {
        this.values.sort((a, b) => (a.cost + a.heuristic) - (b.cost + b.heuristic));
    }

    isEmpty() {
        return this.values.length === 0;
    }
}
