function serializeState(state) {
    return state.map(col => col.join(',')).join('|');
}

function calculateHeuristic(state) {
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
}

function getTargetColumnForBead(bead) {
    switch(bead) {
        case 'blue': return 0;
        case 'red': return 1;
        case 'yellow': return 2;
        case 'purple': return 3;
        case 'green': return 4;
        case 'orange': return 5;
        default: return -1;
    }
}

function findEmptyPosition(state) {
    for (let col = 0; col < state.length; col++) {
        const row = state[col].indexOf(null);
        if (row !== -1) {
            return { col, row };
        }
    }
    return null;
}

export { serializeState, calculateHeuristic, getTargetColumnForBead, findEmptyPosition };
