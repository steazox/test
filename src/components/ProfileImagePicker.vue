<template>
  <div class="profile-image-picker">
    <div class="image-container">
      <img v-if="imageUrl" :src="imageUrl" :alt="altText" class="profile-image" />
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch  } from "vue";
import { doc, updateDoc, getFirestore, getDoc } from "firebase/firestore";
import {getAuth} from 'firebase/auth' 
const props = defineProps({
  userId: {
    type: String,
    required: true,
  },
  defaultImage: {
    type: String,
    default: "",
  },
});

const imageUrl = ref(props.defaultImage);
const db = getFirestore();

const fetchUserAvatar = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().avatar) {
      const avatarUrl = `https://c9a2-2a02-8429-4f31-4601-ba27-ebff-feeb-4451.ngrok-free.app/${userSnap.data().avatar}`;
      imageUrl.value = avatarUrl;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de l'avatar :", error);
  }
};

watch(
  () => props.userId,
  (newUserId) => {
    if (!newUserId || newUserId.trim() === "") {
      console.warn("L'ID utilisateur est vide ou invalide.");
      return;
    }
    fetchUserAvatar(newUserId);
  },
  { immediate: true }
);


const emit = defineEmits(["image-updated", "image-deleted"])
const altText = ref("Photo de profil");

onMounted(async () => {
  console.log(await props.userId)
  const isValidUserId = (id) => typeof id === "string" && id.trim() !== "";
  if (!isValidUserId(await props.userId)) {
    console.error("Erreur : L'ID utilisateur fourni n'est pas valide.");
    return;
  }

  try {
    const userRef = await doc(db, 'users', props.userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().avatar) {
      const avatarUrl = "https://c9a2-2a02-8429-4f31-4601-ba27-ebff-feeb-4451.ngrok-free.app/api/file/" + userSnap.data().avatar;
      imageUrl.value = avatarUrl;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de l'avatar au montage :", error);
  }
});


const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const formData = new FormData();
    formData.append("file", file);
    console.log(file);
    const response = await fetch("https://c9a2-2a02-8429-4f31-4601-ba27-ebff-feeb-4451.ngrok-free.app/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Échec de l'upload de l'image");
    }
    const responseData = await response.json();
    console.log(responseData);
    const url = "https://c9a2-2a02-8429-4f31-4601-ba27-ebff-feeb-4451.ngrok-free.app/api/file/" + responseData.fileId;
    imageUrl.value = url;
    emit("image-updated", url);

    

    const userRef = doc(db, 'users', props.userId);
    await updateDoc(userRef, {
      avatar: responseData.fileId,
    });
  } catch (error) {
    console.error("Erreur lors de l'upload de l'image:", error);
    alert("Erreur lors de l'upload de l'image");
  }
};


const deleteImage = async () => {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cette image ?")) {
    return;
  }
  try {
    const response = await fetch("https://c9a2-2a02-8429-4f31-4601-ba27-ebff-feeb-4451.ngrok-free.app/api/delete", {
      method: "POST",
      body: JSON.stringify({ imageUrl: imageUrl.value }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Erreur lors de la suppression de l'image");
    }
    imageUrl.value = "";
    emit("image-deleted");
  } catch (error) {
    console.error("Erreur lors de la suppression de l'image:", error);
    alert("Erreur lors de la suppression de l'image");
  }
};
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