'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login gagal. Periksa data Anda.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
      
      {/* CARD WRAPPER */}
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* BAGIAN KIRI: FORM LOGIN */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white relative">
          
          {/* Logo Header */}
          <div className="flex items-center gap-3 mb-10">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image 
                src="/images/LOGO HOREKA (1).png" 
                alt="Horeka Logo" 
                fill
                className="object-contain"
                priority
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
            <span className="text-xl font-bold text-black tracking-wide">Horeka POS+</span>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Start Your Horeka</h1>
            <p className="text-gray-500 font-medium">Enter your account:</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Username Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={20} />
              </div>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl border border-gray-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-700 placeholder-gray-400 font-medium"
                placeholder="Username"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={20} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-700 placeholder-gray-400 font-medium border border-gray-300"
                placeholder="Password"
              />
            </div>

            {/* Login Button */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#1a3b8f] hover:bg-[#153075] text-white font-bold py-4 rounded-xl shadow-md shadow-blue-900/20 transition-transform active:scale-[0.98] mt-4 uppercase tracking-wider text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin" /> Processing...
                </div>
              ) : (
                'LOGIN'
              )}
            </button>

          </form>

          {/* Helper Text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Belum punya akun?{' '}
              <Link href="/register" className="text-[#1a3b8f] hover:underline font-semibold">
                Daftar sekarang
              </Link>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              <Link href="/" className="text-[#1a3b8f] hover:underline font-semibold">
                Kembali ke Home
              </Link>
            </p>
          </div>
        </div>

        {/* BAGIAN KANAN: GAMBAR BACKGROUND */}
        <div className="w-full md:w-1/2 relative bg-blue-700 hidden md:flex flex-col items-center justify-center text-center p-12 overflow-hidden">
          
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image 
              src="/images/kopibg.png" 
              alt="Coffee Background"
              fill
              className="object-cover"
              priority
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          
          {/* Blue Overlay */}
          <div className="absolute inset-0 bg-blue-800/80 mix-blend-multiply z-10" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-800/60 to-blue-800/60 z-10" />

          {/* Content Text */}
          <div className="relative z-20 max-w-md text-white">
            <h2 className="text-5xl font-bold mb-6 leading-tight drop-shadow-lg">
              Welcome to <br/> Horeka POS+
            </h2>
            <div className="w-24 h-1 bg-white/30 mx-auto mb-6 rounded-full"></div>
            <p className="text-lg text-blue-100 font-light leading-relaxed drop-shadow-md">
              POS app to simplify your business operations
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
