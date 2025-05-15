<template>
  <div class="profile-image-picker">
    <div class="image-container" aria-live="polite">
      <img v-if="imageUrl" :src="imageUrl" :alt="altText" class="profile-image" />
      <div v-else class="placeholder" aria-label="Placeholder image">
        <i class="fas fa-user"></i>
      </div>
    </div>
    <div class="actions">
      <label for="image-upload" class="upload-btn" aria-label="Choose an image">
        <i class="fas fa-upload"></i>
        Choose an image
      </label>
      <input type="file" id="image-upload" accept="image/*" @change="handleFileChange" class="hidden" />
      <button v-if="imageUrl" @click="deleteImage" class="delete-btn" aria-label="Delete the image">
        <i class="fas fa-trash"></i>
        Delete Image
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { doc, updateDoc, getFirestore, getDoc } from "firebase/firestore";

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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://c9a2-2a02-8429-4f31-4601-ba27-ebff-feeb-4451.ngrok-free.app/api";

const imageUrl = ref(props.defaultImage);
const db = getFirestore();
const emit = defineEmits(["image-updated", "image-deleted"]);
const altText = ref("Profile picture");

const fetchUserAvatar = async (userId, retries = 3) => {
  try {
    if (!userId.trim()) throw new Error("Invalid user ID.");
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().avatar) {
      imageUrl.value = `${API_BASE_URL}/file/${userSnap.data().avatar}`;
    }
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying... (${3 - retries} attempts left)`);
      return fetchUserAvatar(userId, retries - 1);
    }
    console.error("Failed to fetch avatar:", error);
  }
};

onMounted(() => {
  fetchUserAvatar(props.userId);
});

watch(
  () => props.userId,
  (newUserId) => {
    fetchUserAvatar(newUserId);
  },
  { immediate: true }
);

const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload error: ${response.statusText}`);
    }

    const responseData = await response.json();
    if (!responseData.fileId) {
      throw new Error("Missing file ID in upload response.");
    }

    const url = `${API_BASE_URL}/file/${responseData.fileId}`;
    imageUrl.value = url;
    emit("image-updated", url);

    const userRef = doc(db, "users", props.userId);
    await updateDoc(userRef, { avatar: responseData.fileId });
  } catch (error) {
    console.error("Image upload error:", error);
    alert("An error occurred while uploading the image.");
  }
};

const deleteImage = async () => {
  if (!confirm("Are you sure you want to delete this image?")) return;

  try {
    const response = await fetch(`${API_BASE_URL}/delete`, {
      method: "POST",
      body: JSON.stringify({ imageUrl: imageUrl.value }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Image deletion error.");
    }

    imageUrl.value = "";
    emit("image-deleted");
  } catch (error) {
    console.error("Image deletion error:", error);
    alert("An error occurred while deleting the image.");
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
