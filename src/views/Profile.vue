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
        <h2>{{ userEmail }}</h2>
        <p>{{ userUid }}</p>
      </div>
      <button @click="signOut" class="sign-out-btn">Se déconnecter</button>
    </div>
    <div class="profile-content">
      <h3>Mes posts</h3>
      <div v-if="posts.length === 0" class="no-posts">
        <p>Aucun post publié</p>
      </div>
      <div v-else class="posts-list">
        <div v-for="post in posts" :key="post.id" class="post-item">
          <h4>{{ post.title }}</h4>
          <p>{{ post.content }}</p>
          <small>{{ formatDate(post.date) }}</small>
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
/* Vos styles existants */
</style>
