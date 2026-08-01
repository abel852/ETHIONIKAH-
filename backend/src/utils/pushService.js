const webpush = require("web-push");
const prisma = require("../config/database");

let initialized = false;

function initWebPush() {
  if (initialized) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@ethionikah.com";

  if (!publicKey || !privateKey) {
    console.warn("[PUSH] VAPID keys not set — web push disabled");
    return;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  initialized = true;
  console.log("[PUSH] Web push initialized");
}

async function saveSubscription(userId, subscription) {
  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: { userId, keys: subscription.keys },
      create: {
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("[PUSH] Save subscription error:", error.message);
    return { success: false, error: error.message };
  }
}

async function removeSubscription(userId, endpoint) {
  try {
    await prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
    return { success: true };
  } catch (error) {
    console.error("[PUSH] Remove subscription error:", error.message);
    return { success: false, error: error.message };
  }
}

async function sendPushToUser(userId, payload) {
  if (!initialized) {
    initWebPush();
    if (!initialized) return;
  }

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) return;

    const pushPayload = JSON.stringify(payload);

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            pushPayload
          );
        } catch (err) {
          // 410 = subscription expired, remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
        }
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    if (sent > 0) {
      console.log(`[PUSH] Sent to ${sent}/${subscriptions.length} devices for user ${userId}`);
    }
  } catch (error) {
    console.error("[PUSH] Send error:", error.message);
  }
}

module.exports = {
  initWebPush,
  saveSubscription,
  removeSubscription,
  sendPushToUser,
};
