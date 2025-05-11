<template>
  <div class="app">
    <div class="content">
      <router-view></router-view>
    </div>
    <Navbar />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'vue-router'
import Navbar from './components/Navbar.vue'

const auth = getAuth()
const router = useRouter()

// Redirection automatique vers le feed si utilisateur connecté
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Utilisateur connecté
    console.log('Utilisateur connecté:', user.email)
    // Redirection vers le feed
    router.push('/feed')
  } else {
    // Aucun utilisateur connecté
    console.log('Aucun utilisateur connecté')
    // Redirection vers la page d'accueil
    router.push('/')
  }
})
</script>

<style>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  padding: 1rem;
}
</style>
