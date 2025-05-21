<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <h2>Compléter votre profil</h2>
        <button class="close-button" @click="$emit('close')">
          <font-awesome-icon icon="times" />
        </button>
      </div>
      <div class="modal-content">
        <form @submit.prevent="handleSubmit" class="profile-form">
          <div class="form-group">
            <label for="displayName">Nom d'affichage</label>
            <input
              type="text"
              id="displayName"
              v-model="displayName"
              required
              class="input-field"
              placeholder="Exemple: John Doe"
            />
            <p class="suggestion-hint">Un username sera automatiquement suggéré</p>
          </div>

          <div class="form-group">
            <label for="pseudo">Pseudo</label>
            <div class="username-container">
              <input
                type="text"
                id="pseudo"
                v-model="username"
                required
                class="input-field"
                placeholder="Exemple: john_doe123"
                :class="{ 'username-available': usernameAvailable }"
              />
              <span class="availability-status" :class="{
                'available': usernameAvailable,
                'unavailable': !usernameAvailable,
                'loading': usernameCheckLoading
              }">
                <font-awesome-icon icon="check" v-if="usernameAvailable && !usernameCheckLoading" />
                <font-awesome-icon icon="times" v-if="!usernameAvailable && !usernameCheckLoading" />
                <font-awesome-icon icon="spinner" v-if="usernameCheckLoading" spin />
              </span>
            </div>
            <p class="availability-message" v-if="!usernameCheckLoading">
              <template v-if="!usernameAvailable">
                <span v-if="!username">
                  Veuillez entrer un pseudo
                </span>
                <span v-else-if="!/^[a-z0-9-]+$/.test(username)">
                  Le pseudo ne peut contenir que des lettres minuscules, chiffres et tirets
                </span>
                <span v-else-if="username.length < 3">
                  Le pseudo doit contenir au moins 3 caractères
                </span>
                <span v-else-if="username.length > 30">
                  Le pseudo ne peut pas dépasser 30 caractères
                </span>
                <span v-else>
                  Ce pseudo est déjà utilisé <br />
                  suggestion : <span class="suggestion" @click="() => {
                    username = suggestion;
                    checkPseudoAvailability(suggestion);
                  }">{{ suggestion }}</span>
                </span>
              </template>
              <template v-else>
                Pseudo disponible
              </template>
            </p>
          </div>

          <div class="form-group">
            <label for="bio">Bio (optionnel)</label>
            <textarea
              id="bio"
              v-model="bio"
              class="input-field textarea"
              placeholder="Dites quelque chose à propos de vous..."
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="secondary-button" @click="$emit('close')">
              Annuler
            </button>
            <button type="submit" class="submit-button" :disabled="loading">
              {{ loading ? 'En cours...' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
import { getAuth, updateProfile } from 'firebase/auth'
import { doc, setDoc, query, where, getDocs, collection } from 'firebase/firestore'
import { db } from '../firebase'

export default {
  name: 'ProfileCompletionModal',
  props: {
    visible: {
      type: Boolean,
      required: true
    }
  },
  setup(props, { emit }) {
    const auth = getAuth()
    const loading = ref(false)
    const displayName = ref('')
    const username = ref('')
    const bio = ref('')
    const usernameAvailable = ref(true)
    const usernameCheckLoading = ref(false)
    const suggestion = ref('')

    // Générer une suggestion de username quand le displayName change
    watch(displayName, (newValue) => {
      if (newValue) {
        const suggestedUsername = newValue
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        username.value = suggestedUsername;
        checkPseudoAvailability(suggestedUsername);
      }
    });

    // Vérifier la disponibilité du pseudo
    const checkPseudoAvailability = async (pseudoToCheck) => {
      if (!pseudoToCheck) {
        usernameAvailable.value = false;
        return;
      }

      // Vérifier le format du pseudo
      const pseudoRegex = /^[a-z0-9-]+$/;
      if (!pseudoRegex.test(pseudoToCheck)) {
        usernameAvailable.value = false;
        return;
      }

      // Vérifier la longueur
      if (pseudoToCheck.length < 3 || pseudoToCheck.length > 30) {
        usernameAvailable.value = false;
        return;
      }

      // Vérifier la disponibilité dans Firestore
      usernameCheckLoading.value = true;
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('pseudo', '==', pseudoToCheck));
        const querySnapshot = await getDocs(q);
        usernameAvailable.value = querySnapshot.empty;
        generateSuggestion();
      } catch (error) {
        console.error('Erreur lors de la vérification du pseudo:', error);
        usernameAvailable.value = false;
        generateSuggestion();
      } finally {
        usernameCheckLoading.value = false;
        generateSuggestion();
      }
    };

    // Vérifier la disponibilité quand le username change
    watch(username, (newValue) => {
      checkPseudoAvailability(newValue);
    });

    const generateSuggestion = () => {
      suggestion.value = username.value + Math.floor(Math.random() * 100);
    }

    const handleSubmit = async () => {
      try {
        loading.value = true

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
          pseudo: username.value,
          bio: bio.value,
          createdAt: new Date(),
          lastLogin: new Date(),
          avatar: null
        })

        emit('close');
      } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error)
      } finally {
        loading.value = false
      }
    }

    return {
      displayName,
      username,
      bio,
      usernameAvailable,
      checkPseudoAvailability,
      usernameCheckLoading,
      handleSubmit,
      suggestion
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  margin: 1rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1f2937;
}

.close-button {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  font-size: 1.25rem;
}

.close-button:hover {
  color: #111827;
}

.modal-content {
  padding: 1.5rem;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.suggestion {
  color:rgb(34, 118, 197);

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

.username-container {
  position: relative;
  display: flex;
  align-items: center;
}

.username-container .input-field {
  padding-right: 2.5rem;
}

.availability-status {
  position: absolute;
  right: 1rem;
  font-size: 1rem;
}

.available {
  color: #22c55e;
}

.unavailable {
  color: #ef4444;
}

.loading {
  color: #6b7280;
}

.availability-message {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.suggestion-hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.username-available {
  border-color: #22c55e;
}

.textarea {
  min-height: 100px;
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.secondary-button {
  background-color: #e5e7eb;
  color: #1f2937;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.secondary-button:hover {
  background-color: #d1d5db;
}

.submit-button {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.submit-button:hover {
  background-color: #2563eb;
}

.submit-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}
</style>
