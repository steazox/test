<template>
  <div class="auth-container">
    <h2>Inscription</h2>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label for="email">Email</label>
        <input
          type="email"
          id="email"
          v-model="email"
          required
          class="input-field"
        />
      </div>
      <div class="form-group">
        <label for="password">Mot de passe</label>
        <input
          type="password"
          id="password"
          v-model="password"
          required
          minlength="6"
          class="input-field"
        />
      </div>
      <div class="form-group">
        <label for="confirmPassword">Confirmer le mot de passe</label>
        <input
          type="password"
          id="confirmPassword"
          v-model="confirmPassword"
          required
          minlength="6"
          class="input-field"
        />
      </div>
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      <button type="submit" :disabled="loading" class="auth-button">
        {{ loading ? 'En cours...' : "S'inscrire" }}
      </button>
    </form>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import app from "../../firebase";
import { useRouter } from 'vue-router';

export default {
  name: "Register",
  setup() {
    const email = ref("");
    const password = ref("");
    const confirmPassword = ref("");
    const error = ref(null);
    const loading = ref(false);
    const auth = getAuth(app);
    const router = useRouter();

    // Vérification de la connexion au chargement du composant
    onMounted(() => {
      if (auth.currentUser) {
        router.push('/feed');
        return;
      }
    });

    const handleRegister = async () => {
      if (auth.currentUser) {
        router.push('/feed');
        return;
      }

      if (password.value !== confirmPassword.value) {
        error.value = "Les mots de passe ne correspondent pas.";
        return;
      }

      loading.value = true;
      error.value = null;

      try {
        await createUserWithEmailAndPassword(auth, email.value, password.value);
        alert("Compte créé avec succès !");
        router.push('/feed');
      } catch (err) {
        error.value = "Erreur : " + err.message;
      } finally {
        loading.value = false;
      }
    };

    return {
      email,
      password,
      confirmPassword,
      error,
      loading,
      handleRegister,
    };
  },
};
</script>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.form-group {
  margin-bottom: 15px;
}
.input-field {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.auth-button {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}
.auth-button:disabled {
  background-color: #aaa;
  cursor: not-allowed;
}
.error-message {
  color: red;
  font-size: 0.9rem;
  margin-bottom: 10px;
}
</style>
