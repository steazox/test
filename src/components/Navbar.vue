<template>
  <nav class="navbar">
    <router-link
      to="/feed"
      class="nav-item"
      :class="{ active: route.path === '/feed' }"
    >
      <i class="fas fa-home"></i>
      <span>Feed</span>
    </router-link>
    <router-link
      to="/posts/new"
      class="nav-item"
      :class="{ active: route.path === '/posts/new' }"
    >
      <i class="fas fa-plus-circle"></i>
      <span>Nouveau Post</span>
    </router-link>
    <router-link
      to="/profile"
      class="nav-item"
      :class="{ active: route.path === '/profile' }"
    >
      <i class="fas fa-user"></i>
      <span>Profil</span>
    </router-link>
  </nav>
</template>

<script setup>
import { useRoute } from "vue-router";
import { getAuth } from 'firebase/auth';
import AuthButton from './AuthButton.vue';

const route = useRoute();
const auth = getAuth();
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
