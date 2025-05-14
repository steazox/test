<template>
  <div class="post-card">
    <div class="post-header">
      <div class="author-info">
        <h3 class="author-name">{{ post.authorDisplayName }}</h3>
        <p class="author-pseudo">@{{ post.authorPseudo }}</p>
        <p class="post-date">{{ formatDate(post.createdAt) }}</p>
      </div>
    </div>

    <div class="post-content">
      <h4 class="post-title">{{ post.title }}</h4>
      <p class="post-text">{{ post.text }}</p>
    </div>

    <div v-if="post.imageUrl" class="post-image">
      <img :src="post.imageUrl" :alt="post.title" />
    </div>

    <div class="post-actions">
      <div class="action-buttons">
        <button @click="toggleLike" class="action-button">
          <font-awesome-icon :icon="post.liked ? 'heart' : 'heart-o'" />
          {{ post.likes.length }}
        </button>
        <button @click="toggleComment" class="action-button">
          <font-awesome-icon icon="comment" />
          {{ post.comments.length }}
        </button>
      </div>
    </div>

    <div v-if="showComments" class="comments-section">
      <CommentsSection :post-id="post.id" @comment-added="handleCommentAdded" />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { getAuth } from 'firebase/auth'
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import CommentsSection from './CommentsSection.vue'

export default {
  name: 'PostCard',
  components: {
    CommentsSection
  },
  props: {
    post: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const auth = getAuth()
    const showComments = ref(false)
    const userLiked = ref(false)

    const formatDate = (timestamp) => {
      const date = new Date(timestamp)
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const toggleLike = async () => {
      try {
        const postRef = doc(db, 'posts', props.post.id)
        const userRef = doc(db, 'users', auth.currentUser.uid)
        const postDoc = await getDoc(postRef)
        const postData = postDoc.data()

        const likes = postData.likes || []
        const index = likes.indexOf(auth.currentUser.uid)

        if (index === -1) {
          likes.push(auth.currentUser.uid)
        } else {
          likes.splice(index, 1)
        }

        await updateDoc(postRef, { likes })
      } catch (error) {
        console.error('Erreur lors du like:', error)
      }
    }

    const toggleComment = () => {
      showComments.value = !showComments.value
    }

    const handleCommentAdded = () => {
      // Récupérer le nombre de commentaires mis à jour
      const commentsRef = collection(db, 'comments')
      const q = query(commentsRef, where('postId', '==', props.post.id))
      const querySnapshot = await getDocs(q)
      const commentsCount = querySnapshot.size
      
      // Mettre à jour le nombre de commentaires dans le post
      const postRef = doc(db, 'posts', props.post.id)
      await updateDoc(postRef, { comments: commentsCount })
    }

    return {
      formatDate,
      toggleLike,
      toggleComment,
      showComments,
      handleCommentAdded
    }
  }
}
</script>

<style scoped>
.post-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.post-header {
  display: flex;
  align-items: center;
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
  margin: 0;
}

.author-pseudo {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.post-date {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.post-content {
  margin-bottom: 1.5rem;
}

.post-title {
  font-size: 1.25rem;
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.post-text {
  margin: 0;
  color: #4b5563;
}

.post-image {
  margin: 1.5rem 0;
  border-radius: 0.5rem;
  overflow: hidden;
}

.post-image img {
  width: 100%;
  height: auto;
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

.action-buttons {
  display: flex;
  gap: 1rem;
}

.action-button {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.action-button:hover {
  color: #1f2937;
}

.comments-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}
</style>
