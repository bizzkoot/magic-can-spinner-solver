# 🧩 Bead Puzzle Solver

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![Vue.js](https://img.shields.io/badge/Vue.js-2.x-green)]()

> An interactive puzzle solver application built with Vue.js that helps solve complex bead arrangement puzzles through various algorithms.

## 📋 Table of Contents
- [Puzzle Structure](#-puzzle-structure)
- [Movement Rules](#-movement-rules)
- [Development Progress](#-development-progress)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Development](#-development)
- [Deployment](#-deployment)

## 🎮 Puzzle Structure

### Initial State
```plaintext
Column 1    Column 2  Column 3  Column 4  Column 5  Column 6
[empty]     ---Row 4 (only exists in Column 1)---
[yellow]    [purple]  [orange]  [purple]  [orange]  [purple]   Row 3
[blue]      [red]     [blue]    [green]   [orange]  [yellow]   Row 2
[green]     [red]     [blue]    [green]   [orange]  [yellow]   Row 1
```

### 🎯 Goal State Requirements
- ✅ All beads in each column must be the same color
- ✅ Column 1 must have exactly 3 beads with empty space in Row 4
- ✅ Other columns must have all 3 positions filled
- ✅ Column positions don't matter (any color can be in any column)

## 🔄 Movement Rules

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
```plaintext
Column 1    Column 2  Column 3  Column 4  Column 5  Column 6
[yellow]    
[empty]     [purple]  [orange]  [purple]  [orange]  [purple]   Row 3
[blue]      [red]     [blue]    [green]   [orange]  [yellow]   Row 2
[green]     [red]     [blue]    [green]   [orange]  [yellow]   Row 1
```

2. Move blue bead from Row 2 Column 1 to Row 3
```plaintext
Column 1    Column 2  Column 3  Column 4  Column 5  Column 6
[yellow]    
[blue]      [purple]  [orange]  [purple]  [orange]  [purple]   Row 3
[empty]     [red]     [blue]    [green]   [orange]  [yellow]   Row 2
[green]     [red]     [blue]    [green]   [orange]  [yellow]   Row 1
```

3. Rotate Row 2 right (beads move: yellow → purple → orange → green → orange → yellow)
```plaintext
Column 1    Column 2  Column 3  Column 4  Column 5  Column 6
[yellow]    
[blue]      [purple]  [orange]  [purple]  [orange]  [purple]   Row 3
[orange]    [yellow]  [empty]   [red]     [blue]    [green]    Row 2
[green]     [red]     [blue]    [green]   [orange]  [yellow]   Row 1
```

4. Valid options depending on empty space position:

   4(a) If empty space is in Column 3 Row 3 (via vertical movement):
```plaintext
Column 1    Column 2  Column 3  Column 4  Column 5  Column 6
[yellow]    
[blue]      [purple]  [empty]   [purple]  [orange]  [purple]   Row 3
[orange]    [yellow]  [orange]  [red]     [blue]    [green]    Row 2
[green]     [red]     [blue]    [green]   [orange]  [yellow]   Row 1
```

   4(b) After rotating Row 1 left (moves empty to Column 3):
```plaintext
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

## 📈 Development Progress

### ✅ Completed Features
- HTML visualization using Vue.js
- State management
- Move tracking
- Input validation

### 🚧 In Progress
- Fixing movement validation rules
- Implementing proper goal state checking
- Optimizing solution search algorithm

## 📁 Project Structure

```plaintext
├── state.js     # State management and manipulation
├── move.js      # Move validation and execution
├── search.js    # Search algorithms (A*, BFS)
├── utils.js     # Utility functions
├── vue_app.js   # Vue.js application
└── script.js    # Main entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js (>=12.x)
- npm (>=6.x)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd bead-puzzle-solver
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm start
```

4. Open application
```bash
open http://localhost:1234
```

### Test Input State
```plaintext
green,blue,yellow,null|red,purple,red|blue,orange,blue|green,purple,red|orange,orange,green|yellow,purple,yellow
```

## 💻 Development

### Available Commands

```bash
# Build the project
npm run build

# Start development server with hot reload
npm start

# Lint and fix files
npm run lint

# Run tests
npm test
```

## 📦 Deployment

### Manual Deployment
```bash
# 1. Clean up
git rm -rf docs/
rm -rf docs/ node_modules/ .cache/

# 2. Fresh install and build
npm install
npm run build

# 3. Deploy
git add docs/
git commit -m "build: Update production build"
git push origin main
```

### Automated Deployment
1. Make the deployment script executable:
```bash
chmod +x deploy.sh
```

2. Run deployment:
```bash
./deploy.sh
```

> Note: After deployment, wait a few minutes for GitHub Pages to update. The site will be available at your GitHub Pages URL.
