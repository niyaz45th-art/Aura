# Aura Push Notification Setup

## Files
- `Admin.html` — Admin push controls + GitHub Pages-safe FCM registration.
- `index.html` — User push is automatic after browser permission; no user ON/OFF control.
- `firebase-messaging-sw.js` — background notification service worker.
- `.github/workflows/aura-push.yml` — free GitHub Actions polling sender.
- `.github/aura-push-dispatcher.js` — trusted FCM sender.

## Admin controls
Realtime Database:
`settings/pushNotifications/adminToUser`
`settings/pushNotifications/userToAdmin`

Both default to ON unless explicitly set to false.

## GitHub Secret
In the GitHub repository:
Settings → Secrets and variables → Actions → New repository secret

Name:
`FIREBASE_SERVICE_ACCOUNT`

Value:
the complete Firebase service-account JSON.

Never put that JSON inside Admin.html, index.html, or firebase-messaging-sw.js.

## Important
This $0 architecture uses GitHub Actions cron polling, so delivery is not guaranteed to be instant. GitHub scheduled jobs can be delayed. For true event-driven realtime sending, use a server-side trigger such as Firebase Cloud Functions (requires Blaze billing account).

## GitHub Pages path
The service worker must be deployed beside the HTML files:
`https://niyaz45th-art.github.io/Aura/firebase-messaging-sw.js`
