<template>
  <div class="new-post-container">
    <div class="post-form">
      <h2>Nouveau Post</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="title">Titre</label>
          <input
            type="text"
            id="title"
            v-model="title"
            required
            placeholder="Entrez un titre"
          />
        </div>
        
        <div class="form-group">
          <label for="content">Contenu</label>
          <textarea
            id="content"
            v-model="content"
            required
            placeholder="Écrivez votre message..."
            rows="4"
          ></textarea>
        </div>

        <div class="form-group" v-if="imageUrl">
          <img :src="imageUrl" :alt="title" class="preview-image" />
        </div>

        <div class="form-group">
          <label for="image">Image (optionnel)</label>
          <input
            type="file"
            id="image"
            @change="handleImageUpload"
            accept="image/*"
          />
        </div>

        <div class="form-actions">
          <button type="submit" :disabled="loading || (!title && !content && !image)">
            {{ loading ? 'Publication en cours...' : 'Publier' }}
          </button>
          <router-link to="/feed" class="cancel-btn">Annuler</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { auth, db, storage } from '../firebase'
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useRouter } from 'vue-router'

const router = useRouter()



const title = ref('')
const content = ref('')
const image = ref(null)
const imageUrl = ref('')
const displayName = ref('')
const loading = ref(false)

// Charger les informations utilisateur
const loadUserInfo = async () => {
  try {
    const user = auth.currentUser
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        displayName.value = userData.displayName || user.email
      } else {
        // Créer un nouveau document utilisateur si n'existe pas
        await addDoc(collection(db, 'users'), {
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          createdAt: serverTimestamp()
        })
        displayName.value = user.email.split('@')[0]
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des informations utilisateur:', error)
  }
}

onMounted(() => {
  loadUserInfo()
})

const handleImageUpload = async (event) => {
  const file = event.target.files[0]
  if (file) {
    const storageRef = storageRef(storage, `posts/${file.name}`)
    await uploadBytes(storageRef, file)
    imageUrl.value = await getDownloadURL(storageRef)
  }
}

const handleSubmit = () => {
  createPost()
}

const createPost = async () => {
  if (!title.value || !content.value) {
    alert('Veuillez remplir le titre et le contenu')
    return
  }

  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error('Aucun utilisateur connecté')
    }

    loading.value = true

    // Créer le post
    const postRef = collection(db, 'posts')
    await addDoc(postRef, {
      title: title.value,
      content: content.value,
      authorId: user.uid,
      authorEmail: user.email,
      authorDisplayName: displayName.value,
      imageUrl: imageUrl.value,
      createdAt: serverTimestamp(),
      likes: [],
      comments: []
    })

    // Réinitialiser les champs
    title.value = ''
    content.value = ''
    imageUrl.value = ''
    image.value = null

    // Rediriger vers le feed
    router.push('/feed')
  } catch (error) {
    console.error('Erreur lors de la création du post:', error)
    alert(`Une erreur est survenue lors de la création du post: ${error.message}`)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.new-post-container {
  padding: 15px;
  min-height: 100vh;
}

.post-form {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
}

.post-form h2 {
  margin: 0 0 20px;
  font-size: 20px;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #666;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.form-actions button {
  flex: 1;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.form-actions button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.form-actions .cancel-btn {
  flex: 1;
  padding: 10px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
}

/* Styles pour mobile */
@media screen and (max-width: 768px) {
  .post-form {
    padding: 15px;
  }

  .form-group input,
  .form-group textarea {
    font-size: 13px;
  }

  .form-actions button,
  .form-actions .cancel-btn {
    padding: 8px;
    font-size: 13px;
  }
}
</style>
