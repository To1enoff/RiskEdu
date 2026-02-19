import { AuthResponse } from '../types';
import { apiClient } from './client';

export const login = async (email: string, password: string) => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password });
  return data;
};

export const register = async (email: string, password: string, fullName?: string) => {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', {
    email,
    password,
    fullName,
  });
  return data;
};
