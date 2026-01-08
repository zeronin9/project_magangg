'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function VerifySuccessPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Check if verification was successful
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token) {
      // Jika tidak ada token, redirect ke register
      router.push('/register');
      return;
    }

    // Parse user data untuk mendapatkan email
    if (user) {
      try {
        const userData = JSON.parse(user);
        setUserEmail(userData.email || '');
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, [router]);

  const handleGoToLogin = () => {
    // Clear token dan user data karena harus login ulang
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect ke halaman login
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
      
      {/* CARD WRAPPER */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm overflow-hidden">
        
        <div className="p-8 text-center">
          
          {/* Logo Header */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
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

          {/* Success Icon with Pulsing Animation */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Pulsing Background */}
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
              {/* Static Background */}
              <div className="relative bg-green-100 p-6 rounded-full">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            Verifikasi Berhasil!
          </h1>
          <p className="text-gray-600 mb-8">
            Akun Anda telah berhasil dibuat dan diverifikasi. <br/>
            Sekarang Anda dapat login dan mulai menggunakan HOREKA POS+.
          </p>

          {/* Success Info Box */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-semibold text-green-900 mb-1">
                  Akun Anda Siap Digunakan
                </p>
                <p className="text-xs text-green-700">
                  Silakan login dengan kredensial yang telah Anda buat untuk mulai mengelola bisnis Anda.
                </p>
              </div>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleGoToLogin}
            className="inline-flex items-center justify-center gap-2 w-full bg-[#1a3b8f] hover:bg-[#153075] text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-blue-900/20 transition-transform active:scale-[0.98] uppercase tracking-wider text-sm"
          >
            Masuk Sekarang <ArrowRight size={18} />
          </button>

          {/* Helper Text */}
          <div className="mt-6">
            <p className="text-xs text-gray-500">
              Butuh bantuan?{' '}
              <Link href="/" className="text-[#1a3b8f] hover:underline font-semibold">
                Hubungi Support
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
