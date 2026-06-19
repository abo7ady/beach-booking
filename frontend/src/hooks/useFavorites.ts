'use client';

import useSWR from 'swr';
import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { FavoritesResponse } from '@/types';

const fetcher = async (url: string) => {
  const res = await api.get(url);
  return res.data;
};

export const useFavorites = () => {
  const { token } = useAuthStore();

  const { data, error, isLoading, mutate } = useSWR<FavoritesResponse>(
    token ? '/favorites' : null,
    fetcher
  );

  const [optimisticIds, setOptimisticIds] = useState<Set<string>>(new Set());

  const isFavorited = useCallback(
    (activityId: string) => {
      if (optimisticIds.has(activityId)) {
        return !(data?.ids || []).includes(activityId);
      }
      return (data?.ids || []).includes(activityId);
    },
    [data?.ids, optimisticIds]
  );

  const toggleFavorite = useCallback(
    async (activityId: string) => {
      // Optimistic update
      setOptimisticIds((prev) => {
        const next = new Set(prev);
        if (next.has(activityId)) {
          next.delete(activityId);
        } else {
          next.add(activityId);
        }
        return next;
      });

      try {
        await api.post(`/favorites/${activityId}`);
        setOptimisticIds((prev) => {
          const next = new Set(prev);
          next.delete(activityId);
          return next;
        });
        mutate();
      } catch {
        // Revert on error
        setOptimisticIds((prev) => {
          const next = new Set(prev);
          next.delete(activityId);
          return next;
        });
      }
    },
    [mutate]
  );

  return {
    favorites: data?.favorites || [],
    favoriteIds: data?.ids || [],
    isFavorited,
    toggleFavorite,
    isLoading,
    error,
    mutate,
  };
};
