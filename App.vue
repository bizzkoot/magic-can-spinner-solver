<template>
  <div class="container">
    <!-- Row Labels -->
    <div class="row-labels">
      <div class="row-label">Row 4</div>
      <div class="row-label">Row 3</div>
      <div class="row-label">Row 2</div>
      <div class="row-label">Row 1</div>
    </div>

    <!-- Puzzle Grid -->
    <div v-for="(column, colIndex) in columns" :key="colIndex" class="column">
      <div v-for="(bead, rowIndex) in column.beads" :key="rowIndex" 
           :class="['bead', bead || 'empty']">
      </div>
    </div>

    <!-- Controls -->
    <div class="controls">
      <button @click="resetToInitial">Reset</button>
      <button @click="solvePuzzle" :disabled="solving">
        {{ solving ? 'Solving...' : 'Solve Puzzle' }}
      </button>
      
      <!-- Quick Input Section -->
      <div class="quick-input">
        <h3>Quick Input</h3>
        <textarea v-model="quickInput" placeholder="Enter puzzle state..."></textarea>
        <button @click="applyQuickInput">Apply</button>
        <div v-if="quickInputError" class="error-text">{{ quickInputError }}</div>
      </div>

      <!-- Current State Display -->
      <div class="state-display">
        <h3>Current State</h3>
        <div class="copy-area">{{ getCurrentStateAsString() }}</div>
        <button class="copy-button" @click="copyCurrentState">Copy State</button>
      </div>

      <!-- Solution Steps -->
      <div v-if="solution.length" class="solution-steps">
        <h3>Solution Steps:</h3>
        <ol>
          <li v-for="(move, index) in solution" :key="index">
            {{ move.type === 'vertical' ? 
              `Move bead in column ${move.col + 1} from row ${move.from + 1} to row ${move.to + 1}` :
              `Rotate row ${move.row + 1} ${move.direction}` }}
          </li>
        </ol>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import puzzleSolver from './vue_app.js';

export default defineComponent({
  ...puzzleSolver
});
</script>
