<template>
  <div class="feed-container">
    <div class="feed-wrapper">
      <div class="header">
        <h1 class="feed-title">Feed</h1>
        <button @click="signOutUser" class="sign-out-btn">
          <font-awesome-icon icon="sign-out-alt" class="mr-2" />
          Se déconnecter
        </button>
      </div>

      <div class="posts" v-if="!loading">
        <div v-for="post in posts" :key="post.id" class="post">
          <div class="post-header">
            <div class="author-info">
              <h3 class="author-name">{{ post.authorDisplayName }}</h3>
              <p class="post-date">{{ formatDate(post.createdAt) }}</p>
            </div>
          </div>

          <h2 class="post-title">{{ post.title }}</h2>
          <p class="post-content">{{ post.content }}</p>

          <div v-if="post.imageUrl" class="post-image">
            <img :src="post.imageUrl" :alt="post.title" />
          </div>

          <div class="post-actions">
            <div class="actions">
              <button @click="toggleLike(post.id)" class="like-btn">
                <font-awesome-icon
                  :icon="['fas', 'heart']"
                  :style="{ color: isPostLiked(post.id) ? 'red' : 'gray' }"
                />
                <span :class="{ 'liked': isPostLiked(post.id) }">{{ post.likes?.length || 0 }}</span>
              </button>
              <button @click="openComments(post.id)" class="comment-btn">
                <font-awesome-icon icon="comment" class="mr-1" />
                <span>{{ post.comments?.length || 0 }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <CommentsSection
        :postId="selectedPostId"
        :visible="commentsVisible"
        :closeComments="closeComments"
      />

      <div class="loading-indicator" v-if="loading">
        <div class="spinner"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db } from '../firebase';
import { collection, getDocs, updateDoc, doc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import CommentsSection from '../components/CommentsSection.vue';

export default {
  name: 'Feed',
  components: { CommentsSection },
  setup() {
    const router = useRouter();
    const userEmail = ref('');
    const posts = ref([]);
    const loading = ref(true);
    const selectedPostId = ref(null);
    const commentsVisible = ref(false);

    const loadPosts = async () => {
      try {
        const postsRef = collection(db, 'posts');
        const snapshot = await getDocs(postsRef);
        posts.value = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        loading.value = false;
      } catch (error) {
        console.error('Erreur lors du chargement des posts:', error);
      }
    };

    const isPostLiked = (postId) => {
      const post = posts.value.find((p) => p.id === postId);
      const user = auth.currentUser;

      if (!post || !user) return false;
      return post.likes?.includes(user.uid);
    };

    const openComments = (postId) => {
      selectedPostId.value = postId;
      commentsVisible.value = true;
    };

    const closeComments = () => {
      commentsVisible.value = false;
      selectedPostId.value = null;
    };

    const signOutUser = async () => {
      try {
        await signOut(auth);
        router.push('/login');
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
      }
    };

    const toggleLike = async (postId) => {
      const user = auth.currentUser;
      if (!user) return;

      const postRef = doc(db, 'posts', postId);
      const post = posts.value.find((p) => p.id === postId);

      if (post.likes.includes(user.uid)) {
        await updateDoc(postRef, { likes: arrayRemove(user.uid) });
        post.likes = post.likes.filter((uid) => uid !== user.uid);
      } else {
        await updateDoc(postRef, { likes: arrayUnion(user.uid) });
        post.likes.push(user.uid);
      }
    };

    onMounted(() => {
      if (auth.currentUser) {
        userEmail.value = auth.currentUser.email;
        loadPosts();
      }
    });

    const formatDate = (timestamp) => {
      if (!timestamp) return 'Date inconnue';
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    return {
      userEmail,
      posts,
      loading,
      selectedPostId,
      commentsVisible,
      openComments,
      closeComments,
      toggleLike,
      isPostLiked,
      signOutUser,
      formatDate,
    };
  },
};
</script>

<style scoped>
.feed-container {
  min-height: 100vh;
  background-color: #f7fafc;
  padding: 16px;
}

.feed-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.feed-title {
  font-size: 24px;
  font-weight: bold;
  color: #2d3748;
}

.sign-out-btn {
  background-color: #f56565;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
}

.sign-out-btn:hover {
  background-color: #e53e3e;
}

.posts {
  margin-bottom: 24px;
}

.post {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 24px;
}

.post-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.author-info {
  display: flex;
  align-items: center;
}

.author-name {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
}

.post-date {
  font-size: 14px;
  color: #718096;
}

.post-title {
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 16px;
}

.post-content {
  color: #4a5568;
  margin-bottom: 16px;
}

.post-image img {
  border-radius: 8px;
  width: 100%;
}

.post-actions {
  display: flex;
  justify-content: space-between;
}

.actions {
  display: flex;
  align-items: center;
}

.like-btn,
.comment-btn {
  display: flex;
  align-items: center;
  color: #4a5568;
  cursor: pointer;
  transition: color 0.3s;
}

.like-btn:hover {
  color: #e53e3e;
}

.comment-btn:hover {
  color: #3182ce;
}

.liked {
  color: #e53e3e;
}

.loading-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.spinner {
  border: 4px solid #ccc;
  border-top: 4px solid #3182ce;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
