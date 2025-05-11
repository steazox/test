<template>
  <div class="profile-container">
    <div class="profile-header">
      <div class="profile-info">
        <ProfileImagePicker
          :userId="userUid"
          :defaultImage="userProfileImage"
          @image-updated="updateProfileImage"
          @image-deleted="deleteProfileImage"
        />
        <h2 class="text-2xl font-semibold text-gray-800">{{ userEmail }}</h2>
        <p class="text-gray-500">{{ userUid }}</p>
        <button @click="signOut" class="sign-out-btn mt-4 bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600">
          Se déconnecter
        </button>
      </div>
    </div>
    <div class="profile-content mt-8">
      <h3 class="text-xl font-semibold text-gray-700">Mes posts</h3>
      <div v-if="posts.length === 0" class="no-posts text-center py-4">
        <p class="text-gray-500">Aucun post publié pour le moment.</p>
      </div>
      <div v-else class="posts-list space-y-4">
        <div
          v-for="post in posts"
          :key="post.id"
          class="post-item bg-white p-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
        >
          <div class="flex justify-between items-center mb-3">
            <h4 class="font-semibold text-gray-800">{{ post.title }}</h4>
            <small class="text-gray-500">{{ formatDate(post.date) }}</small>
          </div>
          <p class="text-gray-700">{{ post.content }}</p>
          <div class="post-footer mt-4 flex justify-between items-center text-sm text-gray-500">
            <span>{{ post.comments?.length || 0 }} commentaires</span>
            <button @click="openComments(post.id)" class="text-blue-500 hover:underline">Voir les commentaires</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { getAuth, signOut } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import ProfileImagePicker from "../components/ProfileImagePicker.vue";

export default {
  name: "Profile",
  components: {
    ProfileImagePicker,
  },
  setup() {
    const auth = getAuth();
    const userEmail = ref("");
    const userUid = ref("");
    const posts = ref([]);
    const userProfileImage = ref("");

    onMounted(async () => {
      if (auth.currentUser) {
        userEmail.value = auth.currentUser.email;
        userUid.value = auth.currentUser.uid;
        await loadUserPosts();
        await loadProfileImage();
      }
    });

    const loadUserPosts = async () => {
      const db = getFirestore();
      const postsRef = collection(db, "posts");
      const q = query(postsRef, where("authorId", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      posts.value = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    };

    const loadProfileImage = async () => {
      // Remplacez par le code approprié pour charger l'image de profil.
      userProfileImage.value = "default-image-path"; // Exemple
    };

    const updateProfileImage = (newImagePath) => {
      userProfileImage.value = newImagePath;
    };

    const deleteProfileImage = () => {
      userProfileImage.value = "default-image-path";
    };

    const formatDate = (date) => {
      try {
        if (date instanceof Date) {
          return date.toLocaleString("fr-FR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        } else if (typeof date === "number" || typeof date === "string") {
          const parsedDate = new Date(date);
          return !isNaN(parsedDate.getTime())
            ? parsedDate.toLocaleString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Date invalide";
        }
      } catch (error) {
        console.error("Erreur lors du formatage de la date:", error);
        return "Date invalide";
      }
    };

    const signOutUser = async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Erreur lors de la déconnexion:", error);
      }
    };

    return {
      userEmail,
      userUid,
      posts,
      userProfileImage,
      formatDate,
      signOut: signOutUser,
      updateProfileImage,
      deleteProfileImage,
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

.profile-header {
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.profile-info h2 {
  margin: 10px 0;
}

.sign-out-btn {
  background-color: #f44336;
  color: white;
  padding: 10px 20px;
  border-radius: 30px;
  font-weight: bold;
}

.sign-out-btn:hover {
  background-color: #d32f2f;
}

.profile-content {
  margin-top: 20px;
}

.post-item {
  transition: transform 0.3s ease;
}

.post-item:hover {
  transform: scale(1.05);
}

.post-footer {
  display: flex;
  justify-content: space-between;
}

.no-posts {
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}
</style>
