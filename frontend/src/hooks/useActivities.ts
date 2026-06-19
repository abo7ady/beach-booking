'use client';

import useSWR from 'swr';
import api from '@/lib/api';
import { ActivitiesResponse } from '@/types';

interface UseActivitiesOptions {
  page?: number;
  limit?: number;
  trending?: boolean;
  search?: string;
  sort?: string;
}

const fetcher = async (url: string) => {
  const res = await api.get(url);
  return res.data;
};

export const useActivities = (options: UseActivitiesOptions = {}) => {
  const { page = 1, limit = 12, trending, search, sort } = options;

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (trending) params.set('trending', 'true');
  if (search) params.set('search', search);
  if (sort) params.set('sort', sort);

  const { data, error, isLoading, mutate } = useSWR<ActivitiesResponse>(
    `/activities?${params.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  return {
    activities: data?.activities || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  };
};

export const useActivity = (id: string) => {
  const { data, error, isLoading } = useSWR(
    id ? `/activities/${id}` : null,
    fetcher
  );

  return {
    activity: data?.activity,
    isLoading,
    error,
  };
};
