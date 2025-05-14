<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2 class="auth-title">Connexion</h2>
      <form @submit.prevent="handleLogin" class="auth-form">
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
            class="input-field"
          />
        </div>
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        <div class="form-actions">
          <router-link to="/register" class="link">
            Créer un compte
          </router-link>
          <button type="submit" class="submit-button" :disabled="loading">
            {{ loading ? 'En cours...' : 'Se connecter' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'vue-router';

export default {
  name: 'Login',
  setup() {
    const email = ref('');
    const password = ref('');
    const error = ref('');
    const loading = ref(false);
    const auth = getAuth();
    const router = useRouter();

    // Vérification de la connexion utilisateur au chargement
    onMounted(() => {
      if (auth.currentUser) {
        router.push('/feed');
      }
    });

    const handleLogin = async () => {
      try {
        loading.value = true;
        error.value = '';

        await signInWithEmailAndPassword(auth, email.value, password.value);
        router.push('/feed');
      } catch (err) {
        error.value = 'Connexion échouée. Vérifiez vos identifiants.';
      } finally {
        loading.value = false;
      }
    };

    return {
      email,
      password,
      error,
      loading,
      handleLogin,
    };
  },
};
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f7fafc;
}

.auth-card {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.auth-title {
  text-align: center;
  margin-bottom: 2rem;
  color: #1f2937;
  font-size: 1.5rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  color: #4b5563;
  font-weight: 500;
}

.input-field {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #3b82f6;
}

.submit-button {
  background-color: #3b82f6;
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button:hover:not(:disabled) {
  background-color: #2563eb;
}

.submit-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.error-message {
  color: #ef4444;
  text-align: center;
  margin-top: 1rem;
  font-size: 0.875rem;
}

.link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}
</style>
