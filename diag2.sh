#!/bin/bash
export PGPASSWORD='Ethio234Nikahueuf83Y3rU'
echo '---DB-INDEXES---'
psql -h localhost -U ethionikah_user -d ethionikah -c "SELECT tablename, indexname FROM pg_indexes WHERE schemaname='public' ORDER BY tablename;" 2>/dev/null | head -80
echo '---DB-TABLE-SIZES---'
psql -h localhost -U ethionikah_user -d ethionikah -c "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 20;" 2>/dev/null
echo '---SLOW-QUERIES-ENABLED---'
psql -h localhost -U ethionikah_user -d ethionikah -c "SHOW log_min_duration_statement;" 2>/dev/null
echo '---CONNECTION-COUNT---'
psql -h localhost -U ethionikah_user -d ethionikah -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null
echo '---ACTIVE-QUERIES---'
psql -h localhost -U ethionikah_user -d ethionikah -c "SELECT pid, state, query, query_start FROM pg_stat_activity WHERE state='active' LIMIT 5;" 2>/dev/null
echo '---DONE---'
