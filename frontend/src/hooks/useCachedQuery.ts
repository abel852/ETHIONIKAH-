"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { cacheGetStale, cacheSet, cacheFirstRefresh, CACHE_TTL, STORES } from "@/lib/cache";

type StoreName = typeof STORES[keyof typeof STORES];

interface UseCachedQueryOptions<T> {
  store: StoreName;
  key: string;
  ttl: number;
  fetcher: () => Promise<T>;
  enabled?: boolean;
  onUpdate?: (data: T) => void;
}

interface UseCachedQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  isStale: boolean;
  refetch: () => Promise<void>;
}

/**
 * Cache-first-then-refresh hook for React components.
 * Returns cached data immediately (if available), then fetches fresh data
 * in the background and updates state if data changed.
 */
export function useCachedQuery<T>({
  store,
  key,
  ttl,
  fetcher,
  enabled = true,
  onUpdate,
}: UseCachedQueryOptions<T>): UseCachedQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const fetcherRef = useRef(fetcher);
  const onUpdateRef = useRef(onUpdate);
  fetcherRef.current = fetcher;
  onUpdateRef.current = onUpdate;

  const refetch = useCallback(async () => {
    try {
      const fresh = await fetcherRef.current();
      cacheSet(store, key, fresh, ttl);
      setData(fresh);
      setIsStale(false);
      onUpdateRef.current?.(fresh);
    } catch {
      // keep existing data on error
    } finally {
      setIsLoading(false);
    }
  }, [store, key, ttl]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      // 1. Try cached data first
      const cached = await cacheGetStale<T>(store, key);
      if (cancelled) return;

      if (cached) {
        setData(cached.data);
        setIsStale(cached.isStale);
        setIsLoading(false);
      }

      // 2. Always background-refresh
      try {
        const fresh = await fetcherRef.current();
        if (cancelled) return;
        cacheSet(store, key, fresh, ttl);
        setData(fresh);
        setIsStale(false);
        onUpdateRef.current?.(fresh);
      } catch {
        // keep cached data on error
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [store, key, ttl, enabled]);

  return { data, isLoading, isStale, refetch };
}

/**
 * Simpler hook for one-off cache reads with background refresh.
 * Does not hold state — just triggers the cacheFirstRefresh utility.
 */
export function useCacheFirstRefresh<T>(
  store: StoreName,
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
  onUpdate?: (data: T) => void,
): { data: T | null; refetch: () => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const fetcherRef = useRef(fetcher);
  const onUpdateRef = useRef(onUpdate);
  fetcherRef.current = fetcher;
  onUpdateRef.current = onUpdate;

  const refetch = useCallback(async () => {
    try {
      const fresh = await fetcherRef.current();
      cacheSet(store, key, fresh, ttl);
      setData(fresh);
      onUpdateRef.current?.(fresh);
    } catch { /* ignore */ }
  }, [store, key, ttl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await cacheFirstRefresh<T>(store, key, ttl, fetcherRef.current, (d) => {
        if (!cancelled) {
          setData(d);
          onUpdateRef.current?.(d);
        }
      });
      if (!cancelled && result) setData(result);
    })();
    return () => { cancelled = true; };
  }, [store, key, ttl]);

  return { data, refetch };
}

export { CACHE_TTL, STORES };
