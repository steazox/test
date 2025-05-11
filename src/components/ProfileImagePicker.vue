<template>
  <div class="profile-image-picker">
    <div class="image-container">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="altText"
        class="profile-image"
      />
      <div v-else class="placeholder">
        <i class="fas fa-user"></i>
      </div>
    </div>
    <div class="actions">
      <label for="image-upload" class="upload-btn">
        <i class="fas fa-upload"></i>
        Choisir une image
      </label>
      <input
        type="file"
        id="image-upload"
        accept="image/*"
        @change="handleFileChange"
        class="hidden"
      />
      <button
        v-if="imageUrl"
        @click="deleteImage"
        class="delete-btn"
      >
        <i class="fas fa-trash"></i>
        Supprimer
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { getAuth } from 'firebase/auth'

const props = defineProps({
  userId: {
    type: String,
    required: true
  },
  defaultImage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['image-updated', 'image-deleted'])

const storage = getStorage()
const auth = getAuth()
const imageUrl = ref(props.defaultImage)
const altText = ref('Photo de profil')

const handleFileChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const storageRefPath = `profile-images/${props.userId}/${file.name}`
    const imageRef = storageRef(storage, storageRefPath)

    // Upload de l'image
    await uploadBytes(imageRef, file)

    // Récupération de l'URL de téléchargement
    const url = await getDownloadURL(imageRef)
    imageUrl.value = url
    
    // Émission de l'événement pour mettre à jour le parent
    emit('image-updated', url)
  } catch (error) {
    console.error('Erreur lors de l\'upload de l\'image:', error)
    alert('Erreur lors de l\'upload de l\'image')
  }
}

const deleteImage = async () => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
    return
  }

  try {
    const imageRef = storageRef(storage, `profile-images/${props.userId}`)
    await deleteObject(imageRef)
    imageUrl.value = ''
    emit('image-deleted')
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'image:', error)
    alert('Erreur lors de la suppression de l\'image')
  }
}
</script>

<style scoped>
.profile-image-picker {
  text-align: center;
  margin-bottom: 20px;
}

.image-container {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 15px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #f5f5f5;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 48px;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
}

.upload-btn:hover {
  background-color: #0056b3;
}

.delete-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.delete-btn:hover {
  background-color: #c82333;
}

.hidden {
  display: none;
}

/* Styles pour mobile */
@media screen and (max-width: 768px) {
  .image-container {
    width: 100px;
    height: 100px;
  }

  .actions {
    flex-direction: column;
  }

  .upload-btn,
  .delete-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
