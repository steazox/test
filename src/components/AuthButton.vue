<template>
  <div class="auth-buttons">
    <router-link to="/auth" class="auth-link">
      <font-awesome-icon icon="sign-in-alt" class="mr-1" />
      Connexion
    </router-link>
    <router-link to="/auth" class="auth-link">
      <font-awesome-icon icon="user-plus" class="mr-1" />
      Inscription
    </router-link>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAuth } from 'firebase/auth'

const auth = getAuth()
const user = ref(null)

onMounted(() => {
  const unsubscribe = auth.onAuthStateChanged((currentUser) => {
    user.value = currentUser
    unsubscribe()
  })
})
</script>

<style scoped>
.auth-buttons {
  display: flex;
  gap: 1rem;
  padding: 1rem;
}

.auth-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.auth-link:hover {
  color: #2563eb;
}

.auth-link svg {
  width: 1rem;
  height: 1rem;
}
</style>
