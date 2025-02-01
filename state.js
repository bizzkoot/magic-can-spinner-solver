const INITIAL_STATE = [
    ['blue', 'blue', 'blue', null], // null should be last (top position)
    ['red', 'red', 'red'],
    ['yellow', 'yellow', 'yellow'],
    ['purple', 'purple', 'purple'],
    ['green', 'green', 'green'],
    ['orange', 'orange', 'orange']
];

const stateData = {
        colors: ['blue', 'red', 'yellow', 'purple', 'green', 'orange', null],
        columns: [
            { beads: ['blue', 'blue', 'blue', null] },
            { beads: ['red', 'red', 'red'] },
            { beads: ['yellow', 'yellow', 'yellow'] },
            { beads: ['purple', 'purple', 'purple'] },
            { beads: ['green', 'green', 'green'] },
            { beads: ['orange', 'orange', 'orange'] }
        ],
        initialState: null,
        solving: false,
        solution: [],
        error: null,
        quickInput: '',
        quickInputError: null
    };


function resetToInitial(state) {
    if (state.initialState) {
        state.columns = JSON.parse(JSON.stringify(state.initialState));
        state.solution = [];
        state.error = null;
    }
}


export { INITIAL_STATE, stateData, resetToInitial };
