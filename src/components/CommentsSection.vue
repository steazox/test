<template>
    <div class="comments-container" v-if="visible">
      <div class="comments-header">
        <h3 class="comments-title">Commentaires</h3>
        <button @click="closeComments" class="close-button">
          <font-awesome-icon icon="times" class="icon" />
        </button>
      </div>
  
      <div class="comments-list">
        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <div class="comment-avatar"></div> <!-- Placeholder for avatar -->
          <div class="comment-body">
            <div class="comment-header">
              <strong class="author-name">{{ comment.authorDisplayName }}</strong>
              <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
            </div>
            <p class="comment-content">{{ comment.content }}</p>
            <div class="comment-actions">
              <button v-if="isCommentAuthor(comment.authorId)" @click="deleteComment($index)" class="delete-button">
                <font-awesome-icon icon="trash" class="icon" />
              </button>
            </div>
          </div>
        </div>
      </div>
  
      <form @submit.prevent="addComment" class="comment-input">
        <input
          v-model="newComment"
          type="text"
          placeholder="Ajouter un commentaire..."
          class="input-field"
          required
        />
        <button type="submit" class="submit-button">
          Commenter
        </button>
      </form>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, watch } from "vue";
  import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
  import { auth, db } from "../firebase";
  
  export default {
    name: "CommentsSection",
    props: {
      postId: {
        type: String,
        required: true,
        validator: (value) => {
          if (value === null) {
            console.warn('postId est null, ce qui n\'est pas autorisé');
            return false;
          }
          return true;
        }
      },
      visible: {
        type: Boolean,
        required: true,
      },
      closeComments: {
        type: Function,
        required: true,
      },
    },
    setup(props) {
      const comments = ref([]);
      const newComment = ref("");
      const posting = ref(false);
  
      // Charger les commentaires
      const loadComments = async () => {
        if (!props.postId) {
          console.error('ID du post non défini');
          return;
        }

        try {
          const postRef = doc(db, "posts", props.postId);
          const postSnap = await getDoc(postRef);
          
          if (postSnap.exists()) {
            const post = postSnap.data();
            comments.value = post.comments || [];
            console.log('Commentaires chargés:', comments.value);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des commentaires:', error);
        }
      };
  
      // Poster un commentaire
      const addComment = async () => {
        if (!newComment.value.trim()) return;
  
        try {
          posting.value = true;
          const user = auth.currentUser;
          const postRef = doc(db, "posts", props.postId);
  
          const newCommentData = {
            content: newComment.value,
            createdAt: new Date(),
            authorDisplayName: user.displayName || user.email,
            authorId: user.uid,
          };
  
          await updateDoc(postRef, {
            comments: arrayUnion(newCommentData),
          });
  
          newComment.value = ""; // Clear the input field
          loadComments(); // Reload comments after adding
        } catch (error) {
          console.error("Erreur lors de l'ajout du commentaire:", error);
        } finally {
          posting.value = false;
        }
      };
  
      // Supprimer un commentaire
      const deleteComment = async (commentIndex) => {
        try {
          const postRef = doc(db, "posts", props.postId);
          const postSnap = await getDoc(postRef);

          if (postSnap.exists()) {
            const post = postSnap.data();
            const comments = post.comments || [];
            const updatedComments = comments.filter((_, index) => index !== commentIndex);

            await updateDoc(postRef, { comments: updatedComments });
            loadComments();
          }
        } catch (error) {
          console.error("Erreur lors de la suppression du commentaire:", error);
        }
      };
  
      const isCommentAuthor = (authorId) => {
        return authorId === auth.currentUser?.uid;
      };
  
      const formatDate = (timestamp) => {
        if (!timestamp) return 'Date inconnue';
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
      };
  
      // Gérer le chargement et le déchargement des commentaires
      watch(() => props.visible, (isVisible) => {
        if (isVisible && props.postId) {
          console.log('Chargement des commentaires pour le post:', props.postId);
          loadComments();
        } else {
          console.log('Déchargement des commentaires');
          comments.value = [];
        }
      }, { immediate: true });
  
      return {
        comments,
        newComment,
        posting,
        addComment,
        deleteComment,
        isCommentAuthor,
        formatDate,
      };
    },
  };
  </script>
  
  <style scoped>
  .comments-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: white;
    border-top: 2px solid #e5e7eb;
    backdrop-filter: blur(10px);
    min-height: 50%;
    overflow-y: auto;
    z-index: 50;
    padding: 1.5rem;
    border-radius: 1.5rem 1.5rem 0 0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .comments-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
  }
  
  .comments-title {
    font-size: 1.25rem;
    font-weight: bold;
    color: #1f2937;
  }
  
  .close-button {
    color: #6b7280;
    transition: color 0.3s;
  }
  
  .close-button:hover {
    color: #4b5563;
  }
  
  .comments-list {
    max-height: calc(100% - 120px);
    overflow-y: auto;
  }
  
  .comment-item {
    display: flex;
    padding: 1rem;
    border-radius: 0.5rem;
    background-color: #f9fafb;
    margin-bottom: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: background-color 0.2s ease;
  }
  
  .comment-avatar {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background-color: #d1d5db;
  }
  
  .comment-body {
    flex: 1;
    margin-left: 1rem;
  }
  
  .comment-header {
    display: flex;
    align-items: center;
  }
  
  .author-name {
    font-weight: 600;
    color: #1f2937;
  }
  
  .comment-date {
    font-size: 0.875rem;
    color: #6b7280;
    margin-left: 0.5rem;
  }
  
  .comment-content {
    margin-top: 0.5rem;
    color: #4b5563;
  }
  
  .comment-actions {
    margin-top: 0.5rem;
  }
  
  .delete-button {
    color: #ef4444;
    transition: color 0.2s;
  }
  
  .delete-button:hover {
    color: #dc2626;
  }
  
  .comment-input {
    display: flex;
    align-items: center;
    margin-top: 1rem;
  }
  
  .input-field {
    flex: 1;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    background-color: #f3f4f6;
    color: #1f2937;
    border: 1px solid #d1d5db;
    placeholder-color: #9ca3af;
    outline: none;
    transition: border-color 0.2s;
  }
  
  .input-field:focus {
    border-color: #3b82f6;
  }
  
  .submit-button {
    background-color: #3b82f6;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    margin-left: 0.5rem;
    transition: background-color 0.3s;
  }
  
  .submit-button:hover {
    background-color: #2563eb;
  }
  </style>
  