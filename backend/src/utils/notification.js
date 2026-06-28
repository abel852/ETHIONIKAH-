const prisma = require("../config/database");

const createNotification = async ({ userId, type, title, body }) => {
  return prisma.notification.create({
    data: { userId, type, title, body },
  });
};

const notifyAllAdmins = async ({ type, title, body }) => {
  const admins = await prisma.user.findMany({
    where: { adminRole: { not: null } },
    select: { id: true },
  });
  if (!admins.length) return;
  await prisma.notification.createMany({
    data: admins.map((a) => ({ userId: a.id, type, title, body })),
  });
};

module.exports = { createNotification, notifyAllAdmins };