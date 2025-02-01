/* global Vue */
// Make sure Vue is global
window.Vue = Vue;

import Vue from 'vue';
import App from './vue_app.js';

new Vue({
  el: '#app',
  data() {
    return {
      columns: [],
      colors: ['blue', 'red', 'yellow', 'purple', 'green', 'orange', null],
      solving: false,
      solution: [],
      error: null,
      quickInput: '',
      quickInputError: null
    }
  },
  render: h => h(App)
}).$mount('#app');
