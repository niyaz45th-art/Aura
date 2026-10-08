importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDbcio_VcpqA1seFTp-NvCg9j_rMmnPZKY",
  authDomain: "nyz69-5c5af.firebaseapp.com",
  databaseURL: "https://nyz69-5c5af-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nyz69-5c5af",
  storageBucket: "nyz69-5c5af.firebasestorage.app",
  messagingSenderId: "994890595870",
  appId: "1:994890595870:web:6f08cf815e22cd0627f80f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = data.title || payload.notification?.title || "Aura Notification";
  const body = data.body || payload.notification?.body || "";
  const link = data.link || "https://niyaz45th-art.github.io/Aura/";

  self.registration.showNotification(title, {
    body,
    icon: "https://niyaz45th-art.github.io/Aura/favicon.ico",
    badge: "https://niyaz45th-art.github.io/Aura/favicon.ico",
    tag: data.tag || "aura-push",
    data: { link }
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.link ||
    "https://niyaz45th-art.github.io/Aura/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          if ("navigate" in client) client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
