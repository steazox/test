import { createApp } from 'vue'
import './assets/index.css'
import App from './App.vue'
import { Workbox } from 'workbox-window'
import './firebase'
import router from './router'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// Ajout des icônes Font Awesome
library.add(fas)

// Initialisation du service worker
if ('serviceWorker' in navigator) {
  const wb = new Workbox('/service-worker.js')
  wb.register()
}

const app = createApp(App)
app.use(router)
app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app')
