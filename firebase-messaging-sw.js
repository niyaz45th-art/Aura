/* =========================================================
   Firebase Cloud Messaging Service Worker
   Project: NYZ69 / nyz69-5c5af
   File: firebase-messaging-sw.js

   IMPORTANT:
   এই ফাইলটি index.html এবং Admin.html-এর একই ROOT folder-এ রাখবেন।
   ========================================================= */

importScripts(
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js'
);

importScripts(
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js'
);


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

firebase.initializeApp({
  apiKey: "AIzaSyDbcio_VcpqA1seFTp-NvCg9j_rMmnPZKY",
  authDomain: "nyz69-5c5af.firebaseapp.com",
  databaseURL: "https://nyz69-5c5af-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nyz69-5c5af",
  storageBucket: "nyz69-5c5af.firebasestorage.app",
  messagingSenderId: "994890595870",
  appId: "1:994890595870:web:6f08cf815e22cd0627f80f"
});


/* =========================================================
   FIREBASE MESSAGING
   ========================================================= */

const messaging = firebase.messaging();


/* =========================================================
   BACKGROUND PUSH NOTIFICATION
   ========================================================= */

messaging.onBackgroundMessage((payload) => {

  console.log(
    '[firebase-messaging-sw.js] Background message received:',
    payload
  );

  const title =
    payload.notification?.title ||
    payload.data?.title ||
    'Notification';

  const body =
    payload.notification?.body ||
    payload.data?.body ||
    '';

  const tag =
    payload.data?.tag ||
    'firebase-push';

  const url =
    payload.data?.url ||
    '/';


  const notificationOptions = {

    body: body,

    icon:
      payload.notification?.icon ||
      '/favicon.ico',

    badge:
      '/favicon.ico',

    tag: tag,

    renotify: true,

    requireInteraction: false,

    data: {
      url: url
    }

  };


  return self.registration.showNotification(
    title,
    notificationOptions
  );

});


/* =========================================================
   NOTIFICATION CLICK
   ========================================================= */

self.addEventListener(
  'notificationclick',
  (event) => {

    console.log(
      '[firebase-messaging-sw.js] Notification clicked'
    );

    event.notification.close();


    const url =
      event.notification?.data?.url ||
      '/';


    event.waitUntil(

      clients
        .matchAll({
          type: 'window',
          includeUncontrolled: true
        })

        .then((clientList) => {

          for (const client of clientList) {

            if ('focus' in client) {

              if (
                'navigate' in client &&
                url
              ) {

                client.navigate(url);

              }

              return client.focus();

            }

          }


          if (clients.openWindow) {

            return clients.openWindow(url);

          }

        })

    );

  }
);


/* =========================================================
   SERVICE WORKER INSTALL
   ========================================================= */

self.addEventListener(
  'install',
  () => {

    console.log(
      '[firebase-messaging-sw.js] Service Worker installed'
    );

    self.skipWaiting();

  }
);


/* =========================================================
   SERVICE WORKER ACTIVATE
   ========================================================= */

self.addEventListener(
  'activate',
  (event) => {

    console.log(
      '[firebase-messaging-sw.js] Service Worker activated'
    );

    event.waitUntil(
      self.clients.claim()
    );

  }
);
