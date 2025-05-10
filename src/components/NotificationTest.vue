<template>
  <div class="notification-container">
    <h2>Test des Notifications PWA</h2>
    <button @click="requestPermission" :disabled="!canShowNotification">
      Demander la permission
    </button>
    <button @click="testNotification" :disabled="!canShowNotification">
      Tester la notification
    </button>
    <div v-if="notificationPermission === 'granted'" class="status">
      <p>Permission accordée</p>
    </div>
    <div v-else-if="notificationPermission === 'denied'" class="status error">
      <p>Permission refusée</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotificationTest',
  data() {
    return {
      notificationPermission: 'default'
    }
  },
  computed: {
    canShowNotification() {
      return this.notificationPermission !== 'denied'
    }
  },
  methods: {
    async requestPermission() {
      try {
        const permission = await Notification.requestPermission()
        this.notificationPermission = permission
        if (permission === 'granted') {
          this.testNotification()
        }
      } catch (error) {
        console.error('Erreur lors de la demande de permission:', error)
      }
    },
    async testNotification() {
      if (this.notificationPermission === 'granted') {
        const notification = new Notification('Test Notification', {
          body: 'Ceci est une notification de test PWA',
          icon: '/icon.png'
        })
        
        // Attendre que l'utilisateur interagisse avec la notification
        notification.onclick = () => {
          window.focus()
        }
      }
    }
  }
}
</script>

<style scoped>
.notification-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  text-align: center;
}

button {
  margin: 1rem;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
}

.status {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 4px;
}

.error {
  background-color: #ffebee;
  color: #c62828;
}
</style>
