const prisma = require("../config/database");
const { emitNotification } = require("./messageSocket");

const createNotification = async ({ userId, type, title, body }) => {
  const notification = await prisma.notification.create({
    data: { userId, type, title, body },
  });
  emitNotification(userId, notification);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, emailNotifications: true },
    });
    if (user && user.emailNotifications) {
      const { sendNotificationEmail } = require("./email");
      await sendNotificationEmail(user.email, user.firstName, title, body);
    }
  } catch (e) {
    console.error("[EMAIL] Notification email failed:", e.message);
  }

  return notification;
};

const notifyAllAdmins = async ({ type, title, body }) => {
  const admins = await prisma.user.findMany({
    where: { adminRole: { not: null } },
    select: { id: true },
  });
  if (!admins.length) return;
  const created = await prisma.notification.createMany({
    data: admins.map((a) => ({ userId: a.id, type, title, body })),
  });
  // Emit to each admin via socket
  for (const a of admins) {
    emitNotification(a.id, { userId: a.id, type, title, body });
  }
  return created;
};

module.exports = { createNotification, notifyAllAdmins };