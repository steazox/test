<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2 class="auth-title">Créer un compte</h2>
      <form @submit.prevent="handleRegister" class="auth-form">
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

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="form-actions">
          <router-link to="/login" class="link">
            Déjà un compte ? Connexion
          </router-link>
          <button type="submit" class="submit-button" :disabled="loading">
            {{ loading ? 'En cours...' : 'Créer le compte' }}
          </button>
        </div>
      </form>
    </div>

    <ProfileCompletionModal
      :visible="showProfileModal"
      @close="handleProfileModalClose"
    />
  </div>
</template>

<script>
import { ref, watch } from "vue";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { useRouter } from 'vue-router';
import ProfileCompletionModal from '../ProfileCompletionModal.vue';

const db = getFirestore();

export default {
  name: "Register",
  components: {
    ProfileCompletionModal
  },
  setup() {
    const router = useRouter();
    const email = ref('');
    const password = ref('');
    const loading = ref(false);
    const error = ref('');
    const auth = getAuth();
    const db = getFirestore();

    const showProfileModal = ref(false);
    const displayName = ref('');
    const username = ref('');
    const bio = ref('');
    const usernameAvailable = ref(true);
    const usernameCheckLoading = ref(false);

    // Générer une suggestion de pseudo quand le displayName change
    watch(displayName, (newValue) => {
      if (newValue) {
        const suggestedPseudo = newValue
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        username.value = suggestedPseudo;
        checkPseudoAvailability(suggestedPseudo);
      }
    });

    // Vérifier la disponibilité du username
    const checkUsernameAvailability = async (usernameToCheck) => {
      if (!usernameToCheck) return;

      usernameCheckLoading.value = true;
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', usernameToCheck));
        const querySnapshot = await getDocs(q);
        usernameAvailable.value = querySnapshot.empty;
      } catch (error) {
        console.error('Erreur lors de la vérification du username:', error);
        usernameAvailable.value = false;
      } finally {
        usernameCheckLoading.value = false;
      }
    };

    // Vérifier la disponibilité quand le pseudo change
    watch(username, (newValue) => {
      checkPseudoAvailability(newValue);
    });

    const handleRegister = async () => {
      try {
        loading.value = true;
        error.value = '';

        // Validation des champs
        if (!email.value || !password.value) {
          throw new Error('Veuillez remplir tous les champs');
        }

        // Vérifier le format de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value)) {
          throw new Error('Format d\'email invalide');
        }

        // Vérifier la longueur du mot de passe
        if (password.value.length < 6) {
          throw new Error('Le mot de passe doit contenir au moins 6 caractères');
        }

        // Créer l'utilisateur avec Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
        const user = userCredential.user;

        // Créer le document utilisateur dans Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          username: '',
          bio: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          avatar: null
        });

        showProfileModal.value = true;
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const handleSubmit = async () => {
      try {
        loading.value = true;

        // Vérifier si le username est disponible
        if (!usernameAvailable.value) {
          throw new Error('Ce username est déjà utilisé');
        }

        // Validation des champs
        if (!displayName.value.trim()) {
          throw new Error('Veuillez entrer un nom d\'affichage');
        }

        if (!username.value.trim()) {
          throw new Error('Veuillez entrer un nom d\'utilisateur');
        }

        // Mettre à jour le profil Firebase
        await updateProfile(auth.currentUser, {
          displayName: displayName.value
        })

        // Créer le document utilisateur dans Firestore
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: displayName.value,
          username: username.value,
          bio: bio.value,
          createdAt: new Date(),
          lastLogin: new Date(),
          avatar: null
        })

        showProfileModal.value = false;
        router.push('/feed');
      } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
      } finally {
        loading.value = false;
      }
    };

    const handleProfileModalClose = () => {
      showProfileModal.value = false;
      router.push('/feed');
    };

    return {
      email,
      password,
      loading,
      error,
      handleRegister,
      showProfileModal,
      handleProfileModalClose
    };
  },
};
</script>

<style scoped>
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

.textarea {
  min-height: 100px;
  resize: vertical;
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

.secondary-button {
  background-color: #e5e7eb;
  color: #1f2937;
  padding: 0.75rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.secondary-button:hover {
  background-color: #d1d5db;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.error-message {
  color: #ef4444;
  text-align: center;
  margin-top: 1rem;
  font-size: 0.875rem;
}

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
