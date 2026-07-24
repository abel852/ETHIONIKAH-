/**
 * PM2 Ecosystem Configuration
 * Optimized for Hostinger VPS: 2 vCPU, 4 GB RAM, Ubuntu 24.04
 *
 * - Backend: Express API + Socket.io (port 5000) — cluster mode, 2 instances
 * - Frontend: Next.js production server (port 3000) — single instance
 *
 * Connection pool budget:
 *   2 backend instances × 5 connections each = 10 PostgreSQL connections
 *   PostgreSQL max_connections = 100 (leaves 90 for admin, maintenance, etc.)
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 */
module.exports = {
  apps: [
    {
      name: "ethionikah-backend",
      cwd: "./backend",
      script: "src/server.js",
      instances: 2,
      exec_mode: "cluster",
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        // Socket.io production limits
        MAX_SOCKET_CONNECTIONS: 500,
        MAX_CONNECTIONS_PER_USER: 3,
        SOCKET_PING_INTERVAL: 25000,
        SOCKET_PING_TIMEOUT: 60000,
        // Concurrency limits
        MAX_CONCURRENT_API: 200,
        MAX_CONCURRENT_MESSAGES: 100,
        MAX_CONCURRENT_UPLOADS: 25,
        MAX_CONCURRENT_PER_USER: 10,
      },
      env_file: ".env",
      // Logging
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // Restart policy
      min_uptime: "10s",
      max_restarts: 10,
      max_restarts_per_hour: 20,
      restart_delay: 3000,
      // Graceful shutdown
      kill_timeout: 10000,
      listen_timeout: 10000,
      shutdown_with_message: false,
      // Watch for file changes (disabled in production)
      watch: false,
    },
    {
      name: "ethionikah-frontend",
      cwd: "./frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_file: ".env",
      // Logging
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // Restart policy
      min_uptime: "10s",
      max_restarts: 10,
      max_restarts_per_hour: 20,
      restart_delay: 3000,
      // Graceful shutdown
      kill_timeout: 10000,
      listen_timeout: 10000,
      shutdown_with_message: false,
      watch: false,
    },
  ],
};
