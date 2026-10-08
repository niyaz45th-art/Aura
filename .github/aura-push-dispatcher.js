const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://nyz69-5c5af-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();
const messaging = admin.messaging();

const ROOT = "pushDispatchState";
const MAX_TOKEN_BATCH = 500;

function now() { return Date.now(); }

async function getSettings() {
  const snap = await db.ref("settings/pushNotifications").once("value");
  const s = snap.val() || {};
  return {
    adminToUser: s.adminToUser !== false,
    userToAdmin: s.userToAdmin !== false
  };
}

async function getState() {
  const snap = await db.ref(ROOT).once("value");
  return snap.val() || {};
}

async function setState(state) {
  await db.ref(ROOT).set(state);
}

async function tokenList(path) {
  const snap = await db.ref(path).once("value");
  const out = [];
  snap.forEach(child => {
    const v = child.val();
    if (v && v.token) out.push({ key: child.key, token: v.token });
  });
  return out;
}

async function cleanupTokens(path, tokens, response) {
  const bad = [];
  response.responses.forEach((r, i) => {
    const code = r.error?.code || "";
    if (code.includes("registration-token-not-registered") ||
        code.includes("invalid-registration-token")) {
      bad.push(tokens[i].key);
    }
  });
  if (!bad.length) return;
  const updates = {};
  bad.forEach(k => updates[k] = null);
  await db.ref(path).update(updates);
}

async function sendToPath(path, title, body, tag, link) {
  const tokens = await tokenList(path);
  if (!tokens.length) return;

  for (let i = 0; i < tokens.length; i += MAX_TOKEN_BATCH) {
    const chunk = tokens.slice(i, i + MAX_TOKEN_BATCH);
    const response = await messaging.sendEachForMulticast({
      tokens: chunk.map(x => x.token),
      data: {
        title: String(title || "Aura Notification"),
        body: String(body || ""),
        tag: String(tag || "aura-push"),
        link: String(link || "https://niyaz45th-art.github.io/Aura/")
      }
    });
    await cleanupTokens(path, chunk, response);
  }
}

async function sendToUser(uid, title, body, tag) {
  await sendToPath(
    `fcmTokens/users/${uid}`,
    title,
    body,
    tag,
    "https://niyaz45th-art.github.io/Aura/"
  );
}

async function sendToAdmin(title, body, tag) {
  await sendToPath(
    "fcmTokens/admin",
    title,
    body,
    tag,
    "https://niyaz45th-art.github.io/Aura/"
  );
}

function maxNotificationTimestamp(data) {
  let m = 0;
  for (const v of Object.values(data || {})) {
    m = Math.max(m, Number(v?.timestamp || 0));
  }
  return m;
}

async function handleNotifications(state, enabled) {
  const snap = await db.ref("notifications").once("value");
  const data = snap.val() || {};
  const items = Object.entries(data)
    .map(([id, v]) => ({ id, ...v }))
    .filter(v => Number(v.timestamp || 0) > 0)
    .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

  const latest = maxNotificationTimestamp(data);

  if (state.notificationBaseline == null) {
    state.notificationBaseline = latest;
    return;
  }

  if (!enabled) {
    state.notificationBaseline = Math.max(state.notificationBaseline, latest);
    return;
  }

  for (const n of items) {
    if (Number(n.timestamp) <= Number(state.notificationBaseline)) continue;
    if (n.target && n.target !== "all") continue;

    await sendToPath(
      "fcmTokens/users",
      n.title || "New Notification",
      n.body || "",
      `notification-${n.id}`,
      "https://niyaz45th-art.github.io/Aura/"
    );
    state.notificationBaseline = Number(n.timestamp);
  }
}

async function handleTransactions(state, settings) {
  const snap = await db.ref("transactions").once("value");
  const all = snap.val() || {};
  const txState = state.transactions || {};

  for (const [uid, txs] of Object.entries(all)) {
    for (const [key, t] of Object.entries(txs || {})) {
      if (!t || !t.type) continue;

      // User -> Admin: only new manual Deposit/Withdraw requests.
      if (settings.userToAdmin &&
          (t.type === "Deposit" || t.type === "Withdraw") &&
          t.status === "Pending") {
        const created = Number(t.createdAt || 0);
        const marker = txState[uid]?.[key]?.userPendingSent;
        if (created && !marker) {
          const label = t.type === "Deposit" ? "New Deposit Request" : "New Withdraw Request";
          const body = `${t.amount || 0} BDT ${t.type} request received.`;
          await sendToAdmin(label, body, `user-tx-${uid}-${key}`);
          txState[uid] = txState[uid] || {};
          txState[uid][key] = txState[uid][key] || {};
          txState[uid][key].userPendingSent = created;
        }
      }

      // Admin -> User: status changes.
      if (settings.adminToUser &&
          (t.type === "Deposit" || t.type === "Withdraw") &&
          ["Approved", "Rejected", "Paid"].includes(String(t.status))) {
        const updated = Number(t.updatedAt || 0);
        const old = Number(txState[uid]?.[key]?.statusSentAt || 0);
        if (updated && updated > old) {
          let title = `${t.type} Update`;
          let body = `Your ${t.type} request is ${t.status}.`;
          await sendToUser(uid, title, body, `status-${uid}-${key}-${updated}`);
          txState[uid] = txState[uid] || {};
          txState[uid][key] = txState[uid][key] || {};
          txState[uid][key].statusSentAt = updated;
        }
      }
    }
  }

  state.transactions = txState;
}

(async () => {
  const settings = await getSettings();
  const state = await getState();

  await handleNotifications(state, settings.adminToUser);
  await handleTransactions(state, settings);

  state.lastRunAt = now();
  await setState(state);
  console.log("Aura push dispatcher completed:", new Date(state.lastRunAt).toISOString());
    process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
