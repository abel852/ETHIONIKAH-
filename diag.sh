#!/bin/bash
echo '---API-TIMES---'
curl -o /dev/null -s -w 'unread-count: %{time_total}s\n' http://localhost:5000/api/notifications/unread-count
curl -o /dev/null -s -w 'badge-counts: %{time_total}s\n' http://localhost:5000/api/profile/badge-counts
curl -o /dev/null -s -w 'ban-info: %{time_total}s\n' http://localhost:5000/api/profile/ban-info
curl -o /dev/null -s -w 'health: %{time_total}s\n' http://localhost:5000/api/health
echo '---DB-INDEXES---'
PGPASSWORD=ethionikah_user psql -h localhost -U ethionikah_user -d ethionikah -c "SELECT tablename, indexname FROM pg_indexes WHERE schemaname='public' ORDER BY tablename;" 2>/dev/null | head -60
echo '---DB-TABLE-SIZES---'
PGPASSWORD=ethionikah_user psql -h localhost -U ethionikah_user -d ethionikah -c "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 15;" 2>/dev/null
echo '---ERROR-LOG---'
grep -i 'slow\|timeout\|error\|ECONNREFUSED' /root/.pm2/logs/ethionikah-backend-error.log 2>/dev/null | tail -15
echo '---DONE---'
