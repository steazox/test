self.addEventListener('install', (event) => {
  console.log('Service Worker installé')
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activé')
  event.waitUntil(self.clients.claim())
})

self.addEventListener('notificationclick', (event) => {
  console.log('Notification cliquée:', event)
  event.notification.close()

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus()
        }
      }
      if ('openWindow' in self.clients) {
        return self.clients.openWindow('/')
      }
    })
  )
})

self.addEventListener('push', (event) => {
  console.log('Push reçu:', event)
  const data = event.data.json()

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.png',
      data: data
    })
  )
})
