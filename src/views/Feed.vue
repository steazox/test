<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <div class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Feed</h1>
        <button @click="signOutUser" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">
          <i class="fas fa-sign-out-alt mr-2"></i>
          Se déconnecter
        </button>
      </div>

      <div class="space-y-6" v-if="!loading">
        <div v-for="post in posts" :key="post.id" class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <div class="ml-3">
                <h3 class="text-gray-800 font-semibold">{{ post.authorDisplayName }}</h3>
                <p class="text-sm text-gray-500">{{ formatDate(post.createdAt) }}</p>
              </div>
            </div>
          </div>

          <h2 class="text-xl font-semibold text-gray-800 mb-4">{{ post.title }}</h2>
          <p class="text-gray-700 mb-4">{{ post.content }}</p>

          <div v-if="post.imageUrl" class="mb-4">
            <img :src="post.imageUrl" :alt="post.title" class="rounded-lg w-full">
          </div>

          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-4">
              <button @click="toggleLike(post.id)" :class="{ 'text-red-500': isPostLiked(post.id) }" class="flex items-center text-gray-600 hover:text-red-500 transition">
                <i class="fas fa-heart mr-1"></i>
                <span>{{ post.likes?.length || 0 }}</span>
              </button>
              <button @click="toggleComments(post.id)" class="flex items-center text-gray-600 hover:text-blue-500 transition">
                <i class="fas fa-comment mr-1"></i>
                <span>{{ post.comments?.length || 0 }}</span>
              </button>
            </div>
          </div>

          <div v-if="showComments[post.id]" class="mt-4">
            <div v-for="comment in post.comments || []" :key="comment.id" class="flex items-start mb-4">
              <div class="ml-3">
                <div class="flex items-center mb-2">
                  <strong class="text-gray-800">{{ comment.authorDisplayName }}</strong>
                  <span class="ml-2 text-sm text-gray-500">{{ formatDate(comment.createdAt) }}</span>
                </div>
                <p class="text-gray-700">{{ comment.content }}</p>
                <div class="flex items-center mt-2" v-if="isCommentAuthor(comment.authorId)">
                  <button @click="deleteComment(post.id, comment.id)" class="text-red-500 hover:text-red-600 transition">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>

            <div class="mt-4">
              <form @submit.prevent="addComment(post.id)" class="flex space-x-4">
                <input
                  v-model="commentsInput[post.id]"
                  type="text"
                  placeholder="Ajouter un commentaire..."
                  class="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
                  Commenter
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-center items-center min-h-[200px]" v-else>
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { auth, db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export default {
  name: 'Feed',
  setup() {
    const userEmail = ref('');
    const posts = ref([]);
    const loading = ref(true);
    const showComments = ref({});
    const commentsInput = ref({});

    onMounted(() => {
      if (auth.currentUser) {
        userEmail.value = auth.currentUser.email;
        loadPosts();
      }
    });

    const loadPosts = async () => {
      try {
        const postsRef = collection(db, 'posts');
        const snapshot = await getDocs(postsRef);
        
        const postsWithInteractions = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const post = {
              id: doc.id,
              ...doc.data()
            };

            // Charger les commentaires
            const commentsRef = collection(db, 'posts', doc.id, 'comments');
            const commentsSnapshot = await getDocs(commentsRef);
            post.comments = commentsSnapshot.docs.map(commentDoc => ({
              id: commentDoc.id,
              ...commentDoc.data()
            }));

            // Charger les likes
            const likesRef = collection(db, 'posts', doc.id, 'likes');
            const likesSnapshot = await getDocs(likesRef);
            post.likes = likesSnapshot.docs.map(likeDoc => likeDoc.data());

            return post;
          })
        );

        posts.value = postsWithInteractions;
        loading.value = false;
      } catch (error) {
        console.error('Erreur lors du chargement des posts:', error);
      }
    };

    const signOutUser = async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
      }
    };

    const toggleComments = (postId) => {
      showComments.value[postId] = !showComments.value[postId];
    };

    const isPostLiked = (postId) => {
  const post = posts.value.find((p) => p.id === postId);
  const user = auth.currentUser;

  if (!post || !user) return false;

  // Si likes est un objet
  if (typeof post.likes === 'object' && post.likes !== null) {
    return Object.keys(post.likes).includes(user.uid);
  }

  // Si likes est un tableau
  if (Array.isArray(post.likes)) {
    return post.likes.some((like) => like === user.uid);
  }

  // Si likes est d'un autre type ou indéfini
  return false;
};

    const toggleLike = async (postId) => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const likesRef = collection(db, 'posts', postId, 'likes');
        const likeRef = doc(likesRef, user.uid);
        const likeDoc = await getDoc(likeRef);

        if (likeDoc.exists()) {
          await deleteDoc(likeRef);
        } else {
          await setDoc(likeRef, {
            userId: user.uid,
            createdAt: serverTimestamp(),
          });
        }

        // Mettre à jour les likes en temps réel
        const postIndex = posts.value.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          const post = posts.value[postIndex];
          const hasLiked = post.likes?.some(l => l.userId === user.uid);
          
          if (hasLiked) {
            posts.value[postIndex].likes = post.likes.filter(
              l => l.userId !== user.uid
            );
          } else {
            posts.value[postIndex].likes = [
              ...(post.likes || []),
              { userId: user.uid }
            ];
          }
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour des likes:', error);
      }
    };


    const addComment = async (postId) => {
      if (!commentsInput.value[postId]) return;

      try {
        const user = auth.currentUser;
        if (!user) return;

        const comment = {
          content: commentsInput.value[postId],
          authorId: user.uid,
          authorDisplayName: user.displayName || user.email.split('@')[0],
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'posts', postId, 'comments'), comment);
        commentsInput.value[postId] = '';
        loadPosts(); // Recharger les posts pour mettre à jour
      } catch (error) {
        console.error('Erreur lors de l\'ajout du commentaire:', error);
      }
    };

    const isCommentAuthor = (authorId) => {
      const user = auth.currentUser;
      return user && user.uid === authorId;
    };

    const formatDate = (date) => {
      if (!date) return 'Date inconnue';
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const deleteComment = async (postId, commentId) => {
      try {
        const db = getFirestore();
        await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));

        // Mettre à jour les commentaires en temps réel
        const postIndex = posts.value.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          posts.value[postIndex].comments = posts.value[postIndex].comments.filter(
            c => c.id !== commentId
          );
        }
      } catch (error) {
        console.error('Erreur lors de la suppression du commentaire:', error);
      }
    };

    return {
      userEmail,
      posts,
      loading,
      showComments,
      commentsInput,
      signOutUser,
      toggleComments,
      isPostLiked,
      addComment,
      formatDate,
    };
  },
};
</script>


