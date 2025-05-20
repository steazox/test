<template>
  <div class="profile-container">
    <div v-if="loading" class="loading">Chargement...</div>
    <div v-else-if="!userProfile" class="error">Profil introuvable</div>
    <div v-else>
      <div class="profile-header">
        <div class="profile-info">
          <!-- Gestion de l'image de profil -->
          <div class="relative profile-image-wrapper">
            <img :src="userProfileImage" alt="Image de profil" class="profile-image" @click="togglePhotoButton" />
            <!-- Bouton pour modifier la photo -->
            <button v-if="isCurrentUser && showPhotoButton" @click="triggerFileInput" class="photo-manager-btn">
              Modifier la photo
            </button>
            <input type="file" accept="image/*" ref="fileInput" class="hidden-file-input" @change="onImageSelected" />
          </div>
          <h2 class="text-2xl font-semibold text-gray-800">{{ userProfile.email }}</h2>
          <p class="text-gray-500">{{ userProfile.id }}</p>

          <button v-if="isCurrentUser" @click="signOut" class="sign-out-btn">
            Se déconnecter
          </button>
        </div>
      </div>

      <div class="profile-content">
        <h3 class="text-xl">Mes posts</h3>
        <div v-if="posts.length === 0" class="no-posts">
          <p>Aucun post publié pour le moment.</p>
        </div>
        <div v-else class="posts-list">
          <div v-for="post in posts" :key="post.id" class="post-item">
            <div class="post-header">
              <h4>{{ post.title }}</h4>
              <small>{{ formatDate(post.date) }}</small>
            </div>
            <p>{{ post.content }}</p>
            <div class="post-footer">
              <span>{{ post.comments?.length || 0 }} commentaires</span>
              <button @click="openComments(post.id)" class="view-comments-btn">
                Voir les commentaires
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modale pour le lecteur d'image -->
      <div v-if="isImageViewerOpen" class="image-viewer-overlay">
        <div class="image-viewer">
          <img :src="userProfileImage" alt="Image de profil" class="image-viewer-img" />
          <button @click="closeImageViewer" class="close-btn">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getFirestore, doc, getDoc, query, where, getDocs, collection, updateDoc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import dotenv from "dotenv";

export default {
  name: "Profile",
  setup() {
    const route = useRoute();
    const auth = getAuth();
    const db = getFirestore();

    const loading = ref(true);
    const userProfile = ref(null);
    const posts = ref([]);
    const isCurrentUser = ref(false);
    const userProfileImage = ref("default-image-path");
    const showPhotoButton = ref(false);
    const isImageViewerOpen = ref(false);
    const fileInput = ref(null);

    const loadUserProfile = async (userId) => {
      try {
        const userDoc = doc(db, "users", userId);
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
          userProfile.value = { id: userId, ...userSnapshot.data() };
          isCurrentUser.value = auth.currentUser?.uid === userId;
          userProfileImage.value = userProfile.value.avatar
            ? import.meta.env.VITE_API_BASE_URL + "api/file/" + userProfile.value.avatar
            : "default-image-path";
        } else {
          userProfile.value = null;
        }
      } catch (error) {
        console.error("Erreur lors du chargement du profil :", error);
      } finally {
        loading.value = false;
      }
    };

    const loadUserPosts = async (userId) => {
      const postsRef = collection(db, "posts");
      const q = query(postsRef, where("authorId", "==", userId));
      const querySnapshot = await getDocs(q);
      posts.value = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    };

    const togglePhotoButton = () => {
      showPhotoButton.value = !showPhotoButton.value;
    };

    const triggerFileInput = () => {
      fileInput.value.click();
    };

    const fetchWithBypass = async (url, options = {}) => {
      options.headers = {
        ...options.headers,
        "bypass-tunnel-reminder": "true",
      };
      return fetch(url, options);
    };

    const onImageSelected = async (event) => {
      const file = event.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const response = await fetchWithBypass(
            import.meta.env.VITE_API_BASE_URL + "api/upload/",
            {
              method: "POST",
              body: formData,
            }
          );

          if (!response.ok) {
            throw new Error("Échec de l'upload de l'image");
          }

          const data = await response.json();
          if (!data.fileID) {
            throw new Error("L'API n'a pas renvoyé de fileID valide");
          }

          const fileID = data.fileID;
          userProfileImage.value = import.meta.env.VITE_API_BASE_URL + "api/file/" + fileID;

          const userDoc = doc(db, "users", auth.currentUser.uid);
          await updateDoc(userDoc, {
            avatar: fileID,
          });
        } catch (error) {
          console.error("Erreur lors de l'upload de l'image :", error);
        }
      }
    };

    const openImageViewer = () => {
      isImageViewerOpen.value = true
    };

    const closeImageViewer = () => {
      isImageViewerOpen.value = false;
    };

    const signOutUser = async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Erreur lors de la déconnexion :", error);
      }
    };

    const formatDate = (date) => {
      try {
        const parsedDate = new Date(date);
        return parsedDate.toLocaleString("fr-FR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } catch (error) {
        return "Date invalide";
      }
    };

    onMounted(async () => {
      const userId = route.params.id;
      if (userId) {
        await loadUserProfile(userId);
        if (userProfile.value) {
          await loadUserPosts(userId);
        }
      } else {
        loading.value = false;
      }
    });

    return {
      loading,
      userProfile,
      posts,
      isCurrentUser,
      userProfileImage,
      showPhotoButton,
      isImageViewerOpen,
      fileInput,
      togglePhotoButton,
      triggerFileInput,
      onImageSelected,
      openImageViewer,
      closeImageViewer,
      signOut: signOutUser,
      formatDate,
    };
  },
};
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.profile-info {
  text-align: center;
}

.profile-image-wrapper {
  position: relative;
  display: inline-block;
}

.profile-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  cursor: pointer;
  object-fit: cover;
  border: 5px solid #d8d8d8; /* Taille, style et couleur de la bordure */
}

.photo-manager-btn {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 5px 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 14px;
  cursor: pointer;
}

.photo-manager-btn:hover {
  background-color: #0056b3;
}

.hidden-file-input {
  display: none;
}

.sign-out-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.sign-out-btn:hover {
  background-color: #d32f2f;
}

.image-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.image-viewer {
  position: relative;
  text-align: center;
}

.image-viewer-img {
  max-width: 90%;
  max-height: 90%;
  border-radius: 8px;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 50%;
  padding: 10px;
  font-size: 20px;
  cursor: pointer;
}

.close-btn:hover {
  background-color: #d32f2f;
}
</style>
