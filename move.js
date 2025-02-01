function isSpecialSlot(colIndex, rowIndex) {
    // Only allow empty slot in Column 1's Row 4 (index 3)
    return colIndex === 0 && rowIndex === 3;
}

function isValidMove(columns, fromCol, fromRow, toCol, toRow) {
    // Vertical moves only in Column 1
    if (fromCol === 0 && toCol === 0) {
        return Math.abs(fromRow - toRow) === 1;
    }

    // Horizontal moves only at Row 3 when Column 1's Row 4 is empty
    if (fromRow === 2 && toRow === 2) {
        if (columns[0].beads[3] === null) {
            return Math.abs(fromCol - toCol) === 1;
        }
    }
    return false;
}

function moveVertical(state, fromCol, fromRow, toCol, toRow) {
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
}


function rotateRow(state, row, direction) {
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
}


export { isSpecialSlot, isValidMove, moveVertical, rotateRow };
