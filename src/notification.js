import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Convertir une clé base64 en Uint8Array pour AWP
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// Configuration du service worker
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      
      // Configurer le service worker pour AWP
      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_PUBLIC_VAPID_KEY)
      });
      
      return registration;
    } catch (error) {
      console.error('Erreur lors du registre du service worker:', error);
      return null;
    }
  }
  return null;
};

// Initialisation du service de notification
const initializeNotificationService = async () => {
  try {
    const registration = await registerServiceWorker();
    if (!registration) return;

    const messaging = getMessaging();
    const auth = getAuth();
    const user = auth.currentUser;
    
    // Demander la permission pour les notifications
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Permission refusée pour les notifications');
      return;
    }

    // Obtenir le token FCM
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_VAPID_KEY, // Clé VAPID privée
      serviceWorkerRegistration: registration
    });

    if (token && user) {
      // Stocker le token dans Firestore avec l'ID utilisateur
      await addDoc(collection(db, 'notificationTokens'), {
        token,
        userId: user.uid,
        createdAt: new Date()
      });

      console.log('Token FCM et AWP configurés avec succès');
      return token;
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des notifications:', error);
  }
};

// Gestionnaire pour les notifications web push
const setupPushNotificationHandler = (callback) => {
  const messaging = getMessaging();
  
  // Gérer les notifications en arrière-plan
  navigator.serviceWorker.addEventListener('push', async (event) => {
    const data = event.data.json();
    console.log('Notification push reçue:', data);
    
    // Afficher la notification
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/favicon.ico',
        data: data.data
      })
    );
  });

  // Gérer les clics sur les notifications
  navigator.serviceWorker.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.notification.data) {
      callback(event.notification.data);
    }
  });

  // Gérer les notifications en premier plan
  onMessage(messaging, (payload) => {
    console.log('Notification reçue:', payload);
    callback(payload);
  });
};

// Afficher une notification
const showNotification = (title, options = {}) => {
  if (Notification.permission !== 'granted') {
    console.warn('Les notifications ne sont pas autorisées');
    return;
  }

  try {
    new Notification(title, {
      ...options,
      icon: '/favicon.ico'
    });
  } catch (error) {
    console.error('Erreur lors de l\'affichage de la notification:', error);
  }
};

// Obtenir l'état actuel des permissions
const getNotificationPermission = () => {
  return Notification.permission;
};

// Exporter les fonctions utiles
export {
  initializeNotificationService,
  setupPushNotificationHandler,
  showNotification,
  getNotificationPermission
};