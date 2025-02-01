# Bead Puzzle Solver

## Puzzle Structure

### Initial State
```
Column 1    Column 2  Column 3  Column 4  Column 5  Column 6
[empty]     ---Row 4 (only exists in Column 1)---
[yellow]    [purple]  [orange]  [purple]  [orange]  [purple]   Row 3
[blue]      [red]     [blue]    [green]   [orange]  [yellow]   Row 2
[green]     [red]     [blue]    [green]   [orange]  [yellow]   Row 1
Structure:
- Column 1: 4 rows (Row 1-3 with beads, Row 4 empty)
- Columns 2-6: 3 rows only (Row 1-3 with beads)
```

### Goal State Requirements
- All beads in each column must be the same color
- Column 1 must have exactly 3 beads with empty space in Row 4
- Other columns must have all 3 positions filled
- Column positions don't matter (any color can be in any column)

## Movement Rules

### Valid Moves

1. Column 1 (Special Column):
   - Only vertical moves between adjacent rows
   - When Row 4 is empty, Row 3 bead can move up
   - When Row 3 becomes empty, Row 2 bead can move up
   - When Row 2 becomes empty, Row 1 bead can move up

2. Other Columns:
   - No vertical moves allowed
   - Horizontal moves only possible at Row 3 level when Row 4 in Column 1 is empty
   - Must move to adjacent columns

3. Row Rotation:
   - Can rotate beads in Rows 1-3 (except row with empty space)
   - Rotation moves all beads in a row one position left or right

### Example Move Sequence
1. Move yellow bead from Row 3 Column 1 to empty Row 4
   ```
   Column 1    Column 2  Column 3  Column 4  Column 5  Column 6
   [yellow]    
   [empty]     [purple]  [orange]  [purple]  [orange]  [purple]   Row 3
   [blue]      [red]     [blue]    [green]   [orange]  [yellow]   Row 2
   [green]     [red]     [blue]    [green]   [orange]  [yellow]   Row 1
   ```

2. Move blue bead from Row 2 Column 1 to Row 3
   ```
   Column 1    Column 2  Column 3  Column 4  Column 5  Column 6
   [yellow]    
   [blue]      [purple]  [orange]  [purple]  [orange]  [purple]   Row 3
   [empty]     [red]     [blue]    [green]   [orange]  [yellow]   Row 2
   [green]     [red]     [blue]    [green]   [orange]  [yellow]   Row 1
   ```

3. Rotate Row 2 right (beads move: yellow → purple → orange → green → orange → yellow)
   ```
   Column 1    Column 2  Column 3  Column 4  Column 5  Column 6
   [yellow]    
   [blue]      [purple]  [orange]  [purple]  [orange]  [purple]   Row 3
   [orange]    [yellow]  [empty]   [red]     [blue]    [green]    Row 2
   [green]     [red]     [blue]    [green]   [orange]  [yellow]   Row 1
   ```

4. Valid options depending on empty space position:

   4(a) If empty space is in Column 3 Row 3 (via vertical movement):
   ```
   Column 1    Column 2  Column 3  Column 4  Column 5  Column 6
   [yellow]    
   [blue]      [purple]  [empty]   [purple]  [orange]  [purple]   Row 3
   [orange]    [yellow]  [orange]  [red]     [blue]    [green]    Row 2
   [green]     [red]     [blue]    [green]   [orange]  [yellow]   Row 1
   ```

   4(b) After rotating Row 1 left (moves empty to Column 3):
   ```
   Column 1    Column 2  Column 3  Column 4  Column 5  Column 6
   [yellow]    
   [blue]      [purple]  [orange]  [purple]  [orange]  [purple]   Row 3
   [orange]    [yellow]  [blue]    [red]     [blue]    [green]    Row 2
   [green]     [red]     [empty]   [green]   [orange]  [yellow]   Row 1
   ```
   
   Key corrections:
   - Moves respect column-specific rules
   - Demonstrates both vertical movement and rotation options
   - Empty spaces only move through valid operations

Key rotation notes:
- Rotation affects ALL beads in a row
- Right rotation moves beads: Column 1 → 2 → 3 → 4 → 5 → 6 → 1
- Left rotation moves beads: Column 6 → 5 → 4 → 3 → 2 → 1 → 6

## Current Progress

1. Basic structure implemented:
   - HTML visualization using Vue.js
   - State management
   - Move tracking
   - Input validation

2. In Progress:
   - Fixing movement validation rules
   - Implementing proper goal state checking
   - Optimizing solution search algorithm

## Project Structure

The project has been refactored into multiple files for better organization and maintainability. The new structure is as follows:

- `state.js`: Manages the puzzle state, including initial state, column data, and state manipulation functions.
- `move.js`: Contains move validation and move execution logic.
- `search.js`: Implements search algorithms (A*, BFS) and related helper functions.
- `utils.js`: Provides utility functions like state serialization, heuristic calculation, and target column determination.
- `vue_app.js`: Defines the Vue.js app and integrates all the modules.
- `script.js`: Imports the Vue app from `vue_app.js`.

## Testing the Application

To test the application, follow these steps:

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open the application in your browser:
```bash
open http://localhost:1234
```

4. Use the interface to:
   - Set up the initial puzzle state
   - Make moves manually
   - Use the solver to find solutions

## Test Input State
```
green,blue,yellow,null|red,purple,red|blue,orange,blue|green,purple,red|orange,orange,green|yellow,purple,yellow
```

## Development Commands

- Build the project:
```bash
npm run build
```

- Start development server with hot reload:
```bash
npm start
```

- Lint and fix files:
```bash
npm run lint
```

- Run tests (if available):
```bash
npm test
```
