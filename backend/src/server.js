const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const path = require("path");
const multer = require("multer");
require("dotenv").config();
const { createServer } = require("http");
const { Server: SocketServer } = require("socket.io");

const app = express();
const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN, credentials: true },
});

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(compression());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const spousePreferenceRoutes = require("./routes/spousePreference");
const verificationRoutes = require("./routes/verification");
const adminRoutes = require("./routes/admin");
const reportRoutes = require("./routes/report");
const complaintRoutes = require("./routes/complaint");
const matchRoutes = require("./routes/match");
const messageRoutes = require("./routes/message");
const subscriptionRoutes = require("./routes/subscription");
const notificationRoutes = require("./routes/notification");

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/spouse-preference", spousePreferenceRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", require("./routes/adminManagement"));
app.use("/api/reports", reportRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api", (_req, res) => {
  res.json({ message: "Islamic Matchmaking Platform API v1.0" });
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  const msg = err instanceof multer.MulterError ? err.message : err.message || "Internal server error";
  res.status(500).json({ error: msg });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, httpServer, io };
