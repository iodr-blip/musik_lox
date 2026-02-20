
const CACHE_NAME = 'megannait-v1.4.1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Handle notification click to bring user back to the app and navigate to chat
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const chatId = event.notification.data?.chatId;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and tell it to navigate
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        
        if (chatId) {
          client.postMessage({ type: 'NAVIGATE_CHAT', chatId });
        }
        
        return client.focus();
      }
      
      // If no window is open, open the app with the chatId in the URL (handled by App/Messenger on init)
      const url = chatId ? `/?chatId=${chatId}` : '/';
      return clients.openWindow(url);
    })
  );
});

// Listener for real Push API events
self.addEventListener('push', (event) => {
  let data = { title: 'MeganNait', body: 'Новое сообщение', chatId: null };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/906/906338.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/906/906338.png',
    tag: data.chatId || 'general',
    data: { chatId: data.chatId },
    vibrate: [200, 100, 200]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
