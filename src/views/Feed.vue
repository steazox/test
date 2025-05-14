<template>
  <div class="feed-container">
    <div class="feed-wrapper">
      <div class="header">
        <h1 class="feed-title">Feed</h1>
        <button @click="signOutUser" class="sign-out-btn">
          <font-awesome-icon icon="sign-out-alt" class="mr-2" />
          Se déconnecter
        </button>
        <button 
          v-if="notificationPermission === 'default'" 
          @click="requestNotificationPermission" 
          class="notification-button"
        >
          Autoriser les notifications
        </button>
      </div>

      <div class="posts" v-if="!loading">
        <div v-for="post in posts" :key="post.id" class="post">
          <div class="post-header">
            <div class="author-info">
              <h3 class="author-name">{{ post.authorDisplayName }}</h3>
              <p class="author-pseudo">@{{ post.authorPseudo }}</p>
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
import { ref, onMounted, computed } from 'vue';
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
    const posts = ref([]);
    const loading = ref(true);
    const selectedPostId = ref('');
    const commentsVisible = ref(false);
    const notificationPermission = ref(Notification.permission);

    // Gestion des notifications
    const requestNotificationPermission = () => {
      if (!('Notification' in window)) {
        console.log('Les notifications ne sont pas supportées par ce navigateur');
        return;
      }
      Notification.requestPermission().then(permission => {
        notificationPermission.value = permission;
        if (permission === 'granted') {
          console.log('Notifications autorisées');
        } else {
          console.log('Notifications refusées ou bloquées');
        }
      });
    };

    const showNotification = (title, body) => {
  if (notificationPermission.value === 'granted') {
    try {
      new Notification(title, { body, icon: '/favicon.ico' });
    } catch (error) {
      console.error('Erreur lors de l’envoi de la notification :', error);
    }
  } else {
    console.warn('Les notifications ne sont pas autorisées.');
  }
};


    const loadPosts = async () => {
      try {
        const postsRef = collection(db, 'posts');
        const snapshot = await getDocs(postsRef);
        posts.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        loading.value = false;
      } catch (error) {
        console.error('Erreur lors du chargement des posts:', error);
      }
    };

    const isPostLiked = postId => {
      const post = posts.value.find(p => p.id === postId);
      const user = auth.currentUser;
      return post && user && post.likes?.includes(user.uid);
    };

    const toggleLike = async postId => {
      const user = auth.currentUser;
      if (!user) return;

      const postRef = doc(db, 'posts', postId);
      const post = posts.value.find(p => p.id === postId);

      if (post.likes.includes(user.uid)) {
        await updateDoc(postRef, { likes: arrayRemove(user.uid) });
        post.likes = post.likes.filter(uid => uid !== user.uid);
        showNotification('Post non aimé', `Vous avez retiré votre like de "${post.title}"`);
      } else {
        await updateDoc(postRef, { likes: arrayUnion(user.uid) });
        post.likes.push(user.uid);
        showNotification('Post aimé', `Vous avez aimé "${post.title}"`);
      }
    };

    const formatDate = timestamp => {
      if (!timestamp) return 'Date inconnue';
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const openComments = postId => {
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

    onMounted(() => {
      if (Notification.permission === 'default') {
        notificationPermission.value = 'default';
      }
      loadPosts();
    });

    return {
      posts,
      loading,
      selectedPostId,
      commentsVisible,
      notificationPermission,
      requestNotificationPermission,
      showNotification,
      toggleLike,
      isPostLiked,
      formatDate,
      openComments,
      closeComments,
      signOutUser,
    };
  },
};
</script>


<style scoped>
.feed-container {
  margin: 0 auto;
  padding: 2rem;
  background: #f3f4f6;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.feed-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.sign-out-btn {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-weight: 500;
}

.sign-out-btn:hover {
  background-color: #dc2626;
  transform: translateY(-1px);
}

.sign-out-btn svg {
  transition: transform 0.2s ease;
}

.sign-out-btn:hover svg {
  transform: translateX(2px);
}

.posts {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.post {
  background-color: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease;
}

.post:hover {
  transform: translateY(-2px);
}

.post-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-right: 1rem;
}

.author-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.author-name::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: #3b82f6;
}

.author-pseudo {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  font-weight: 500;
}

.post-date {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
  opacity: 0.8;
}

.post-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.post-content {
  font-size: 1rem;
  line-height: 1.6;
  color: #4b5563;
  margin-bottom: 1.5rem;
}

.post-image {
  margin: 1.5rem 0;
  border-radius: 0.5rem;
  overflow: hidden;
  aspect-ratio: 16/9;
}

.post-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.actions {
  display: flex;
  gap: 1.5rem;
  flex: 1;
}

.action-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  border-radius: 0.5rem;
}

.action-btn:hover {
  color: #1f2937;
  background-color: #f3f4f6;
  transform: translateY(-1px);
}

.action-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.like-count,
.comment-count {
  color: #6b7280;
  font-size: 0.875rem;
}

.liked {
  color: #ef4444 !important;
}

@media (max-width: 640px) {
  .feed {
    padding: 1rem;
  }

  .feed-title {
    font-size: 1.75rem;
  }

  .post {
    padding: 1rem;
  }

  .post-title {
    font-size: 1.25rem;
  }

  .post-content {
    font-size: 0.875rem;
  }

  .post-actions {
    flex-direction: column;
    gap: 1rem;
  }

  .actions {
    justify-content: space-between;
  }
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
