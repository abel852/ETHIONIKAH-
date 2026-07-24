let io = null;

function setSocket(socketIo) {
  io = socketIo;
}

function emitNewMessage(message, receiverId) {
  if (!io) return;
  io.to(`user:${receiverId}`).emit("new_message", message);
  io.to(`user:${message.senderId}`).emit("new_message", message);
}

function emitMessageDeleted(messageId, deletedFor, userIds) {
  if (!io) return;
  userIds.forEach((uid) => {
    io.to(`user:${uid}`).emit("message_deleted", { messageId, deletedFor });
  });
}

function emitMessageRead(messageId, conversationId, userId) {
  if (!io) return;
  io.to(`user:${userId}`).emit("message_read", { messageId, conversationId });
}

function emitTyping(conversationId, userId, isTyping) {
  if (!io) return;
  io.to(`user:${userId}`).emit("typing", { conversationId, isTyping });
}

function emitOnlineStatus(userId, isOnline) {
  if (!io) return;
  io.emit("user_status", { userId, isOnline });
}

function emitNotification(userId, notification) {
  if (!io) return;
  io.to(`user:${userId}`).emit("new_notification", notification);
}

function emitPaymentStatus(userId, payment) {
  if (!io) return;
  io.to(`user:${userId}`).emit("payment_status_changed", payment);
}

function emitVerificationStatus(userId, verification) {
  if (!io) return;
  io.to(`user:${userId}`).emit("verification_status_changed", verification);
}

module.exports = { setSocket, emitNewMessage, emitMessageDeleted, emitMessageRead, emitTyping, emitOnlineStatus, emitNotification, emitPaymentStatus, emitVerificationStatus };