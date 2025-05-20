<template>
  <nav class="navbar">
    <router-link
      to="/feed"
      class="nav-item"
      :class="{ active: route.path === '/feed' }"
    >
      <font-awesome-icon :icon="['fa-solid', 'fa-home']" />
      <span>Feed</span>
    </router-link>
    <router-link
      to="/posts/new"
      class="nav-item"
      :class="{ active: route.path === '/posts/new' }"
    >
      <font-awesome-icon :icon="['fa-solid', 'fa-plus-circle']" />
      <span>Nouveau Post</span>
    </router-link>
    <router-link
      v-if="userId"
      :to="`/profile/${userId}`"
      class="nav-item"
      :class="{ active: route.path.startsWith('/profile') }"
    >
      <font-awesome-icon :icon="['fa-solid', 'fa-user']" />
      <span>Profil</span>
    </router-link>
    <router-link
      v-else
      to="/login"
      class="nav-item"
    >
      <font-awesome-icon :icon="['fa-solid', 'fa-sign-in-alt']" />
      <span>Se Connecter</span>
    </router-link>
  </nav>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const route = useRoute();
const userId = ref(null);

// Initialisation de Firebase Auth
const auth = getAuth();

// Gestion de l'utilisateur connecté
onMounted(() => {
  console.log(import.meta.env.VITE_API_KEY); // Affiche 123456

  onAuthStateChanged(auth, (user) => {
    userId.value = user ? user.uid : null;
  });
});
</script>

<style>
.navbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  padding: 10px 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  justify-content: space-around;
}

.nav-item {
  text-decoration: none;
  color: #666;
  text-align: center;
  flex: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.nav-item i {
  font-size: 24px;
  margin-bottom: 5px;
}

.nav-item span {
  font-size: 12px;
}

.nav-item.active {
  color: #007bff;
}

.nav-item.active i {
  color: #007bff;
}
</style>
