import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { Workbox } from 'workbox-window'

// Initialisation du service worker
if ('serviceWorker' in navigator) {
  const wb = new Workbox('/service-worker.js')
  wb.register()
}

createApp(App).mount('#app')
