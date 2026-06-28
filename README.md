# Islamic Matchmaking Platform

A secure, scalable, privacy-focused, and Sharia-compliant matrimonial platform enabling Muslims to find suitable marriage partners through verified profiles, intelligent matchmaking, and secure communication.

**Tech Stack:** Next.js 14 · Node.js / Express · PostgreSQL (Prisma) · Redis · Docker · Nginx

## Quick Start

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Copy environment files
cp .env.example .env

# Start infrastructure (PostgreSQL + Redis)
docker-compose up -d

# Run migrations & seed
cd backend && npx prisma migrate dev && npx prisma db seed

# Start development
cd .. && npm run dev
```

## Project Structure

```
islamic-matchmaking-platform/
├── frontend/           # Next.js application
├── backend/            # Express.js API + Prisma
├── database/           # Schema, backups, scripts
├── deployment/         # Nginx, SSL, PM2 configs
├── documentation/      # API, architecture, guides
└── assets/             # UI design, branding, mockups
```

See [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) for the full development timeline.
