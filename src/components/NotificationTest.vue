<template>
  <div class="notification-container">
    <h2>Test des Notifications PWA</h2>

    <div class="buttons">
      <button
        @click="requestPermission"
        :disabled="permissionState !== 'default' || !isSupported"
      >
        {{ permissionState === 'default' ? 'Demander la permission' : permissionState === 'granted' ? 'Permission accordée' : 'Permission refusée' }}
      </button>

      <button
        @click="testNotification"
        :disabled="permissionState !== 'granted' || !isSupported"
      >
        Tester la notification
      </button>
    </div>

    <div v-if="!isSupported" class="status error">
      <p>Votre navigateur ne supporte pas les Notifications PWA.</p>
    </div>

    <div v-if="toast.message" :class="['toast', toast.type]">
      <p>{{ toast.message }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotificationTest',

  data() {
    return {
      permissionState: 'default',
      isSupported: 'Notification' in window,
      toast: {
        message: '',
        type: 'info',
      },
    };
  },

  mounted() {
    if (this.isSupported) {
      this.permissionState = Notification.permission;
      // Enregistrement du service worker si nécessaire
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => {
          console.error('Échec enregistrement SW:', err);
        });
      }
    }
  },

  methods: {
    async requestPermission() {
      try {
        const permission = await Notification.requestPermission();
        this.permissionState = permission;
        if (permission === 'granted') {
          this.showToast('Permission accordée.', 'success');
        } else if (permission === 'denied') {
          this.showToast('Permission refusée.', 'error');
        }
      } catch (error) {
        console.error('Erreur lors de la demande de permission:', error);
        this.showToast('Une erreur est survenue.', 'error');
      }
    },

    async testNotification() {
      if (!this.isSupported) return;

      if (this.permissionState === 'granted') {
        try {
          // Utiliser le service worker si disponible
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            registration.showNotification('Test Notification PWA', {
              body: "Ceci est une notification de test PWA via Service Worker",
              icon: '/icon.png',
              badge: '/badge.png',
              vibrate: [100, 50, 100],
            });
          } else {
            new Notification('Test Notification PWA', {
              body: 'Ceci est une notification de test PWA',
              icon: '/icon.png',
            });
          }
          this.showToast('Notification envoyée.', 'success');
        } catch (err) {
          console.error('Erreur lors de l'envoi de la notification:', err);
          this.showToast('Impossible d'envoyer la notification.', 'error');
        }
      }
    },

    showToast(message, type = 'info') {
      this.toast.message = message;
      this.toast.type = type;
      setTimeout(() => {
        this.toast.message = '';
      }, 3000);
    },
  },
};
</script>

<style scoped>
.notification-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  text-align: center;
}

.buttons {
  margin-bottom: 1.5rem;
}

button {
  margin: 0 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  border-radius: 0.375rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status, .toast {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 4px;
  font-weight: 500;
}

.error {
  background-color: #ffebee;
  color: #c62828;
}

.success {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.info {
  background-color: #e3f2fd;
  color: #1565c0;
}
</style>
