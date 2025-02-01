import Vue from 'vue';
import App from './vue_app.js';

// Remove this line since we're not using global Vue
// window.Vue = Vue;

new Vue({
  el: '#app',
  render: h => h(App)
});
