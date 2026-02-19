import { AuthResponse, RegisterResponse } from '../types';
import { apiClient } from './client';

export const login = async (email: string, password: string) => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password });
  return data;
};

export const register = async (email: string, password: string, fullName?: string) => {
  const { data } = await apiClient.post<RegisterResponse>('/auth/register', {
    email,
    password,
    fullName,
  });
  return data;
};

export const verifyEmail = async (email: string, code: string) => {
  const { data } = await apiClient.post<AuthResponse>('/auth/verify-email', { email, code });
  return data;
};

export const forgotPassword = async (email: string) => {
  const { data } = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (email: string, code: string, newPassword: string) => {
  const { data } = await apiClient.post<{ message: string }>('/auth/reset-password', {
    email,
    code,
    newPassword,
  });
  return data;
};
