<template>
  <div class="home-container">
    <h1>Bienvenue sur notre application</h1>
    <p>Connectez-vous ou inscrivez-vous pour accéder au feed.</p>
    <div class="auth-buttons">
      <router-link to="/login" class="auth-link">Connexion</router-link>
      <router-link to="/register" class="auth-link">Inscription</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>

<style scoped>
.home-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

p {
  color: #666;
  margin-bottom: 30px;
}

.auth-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.auth-link {
  display: inline-block;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.auth-link:hover {
  background-color: #0056b3;
}
</style>
