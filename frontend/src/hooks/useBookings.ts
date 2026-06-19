'use client';

import useSWR from 'swr';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { BookingsResponse } from '@/types';

const fetcher = async (url: string) => {
  const res = await api.get(url);
  return res.data;
};

export const useMyBookings = (page = 1) => {
  const { token } = useAuthStore();

  const { data, error, isLoading, mutate } = useSWR<BookingsResponse>(
    token ? `/bookings/my?page=${page}&limit=10` : null,
    fetcher
  );

  return {
    bookings: data?.bookings || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  };
};

export const useAdminBookings = (page = 1, status?: string) => {
  const { token } = useAuthStore();

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', '20');
  if (status) params.set('status', status);

  const { data, error, isLoading, mutate } = useSWR<BookingsResponse>(
    token ? `/bookings?${params.toString()}` : null,
    fetcher
  );

  return {
    bookings: data?.bookings || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  };
};
