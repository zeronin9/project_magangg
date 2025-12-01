// context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LoginResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    console.log('=== LOGIN DEBUG INFO ===');
    console.log('API Base URL from env:', apiBaseUrl);
    console.log('Full endpoint:', `${apiBaseUrl}/auth/login`);
    console.log('Request payload:', { username, password: '***' });

    // Validasi URL API
    if (!apiBaseUrl) {
      const errorMsg = 'KONFIGURASI ERROR: NEXT_PUBLIC_API_BASE_URL tidak ditemukan di .env.local';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      console.log('Sending login request...');
      
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('Response received');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Content-Type:', response.headers.get('content-type'));

      // Cek apakah response adalah HTML (error page)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('=== NON-JSON RESPONSE ===');
        console.error('Response body (first 500 chars):', textResponse.substring(0, 500));
        
        throw new Error(
          `Server mengembalikan HTML/Text, bukan JSON.\n\n` +
          `Kemungkinan penyebab:\n` +
          `1. API server tidak berjalan\n` +
          `2. URL API salah (${apiBaseUrl}/auth/login)\n` +
          `3. CORS issue\n\n` +
          `Pastikan backend API berjalan di: ${apiBaseUrl}`
        );
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || 'Login gagal');
      }

      const data: LoginResponse = await response.json();
      console.log('Login successful!');
      console.log('User data:', data.user);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);

      // Redirect based on role
      console.log('Redirecting based on role:', data.user.role);
      
      switch (data.user.role) {
        case 'admin_platform':
          router.push('/platform');
          break;
        case 'super_admin':
          router.push('/mitra');
          break;
        case 'branch_admin':
          router.push('/branch');
          break;
        default:
          throw new Error('Invalid role');
      }

    } catch (error) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      
      if (error instanceof TypeError) {
        throw new Error(
          `Network Error: Tidak dapat terhubung ke server.\n\n` +
          `Endpoint: ${apiBaseUrl}/auth/login\n\n` +
          `Solusi:\n` +
          `1. Pastikan backend API berjalan\n` +
          `2. Cek URL di .env.local\n` +
          `3. Cek firewall/network`
        );
      }
      
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
