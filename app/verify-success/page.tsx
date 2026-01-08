'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function VerifySuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Check if user actually verified
    const registeredUser = localStorage.getItem('registeredUser');
    if (!registeredUser) {
      router.push('/register');
      return;
    }

    // Countdown and auto redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

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

          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-6 rounded-full animate-bounce">
              <CheckCircle className="w-16 h-16 text-green-600" />
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
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
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

          {/* Auto Redirect Info */}
          <p className="text-sm text-gray-500 mb-6">
            Anda akan diarahkan ke halaman login dalam <span className="font-bold text-[#1a3b8f]">{countdown}</span> detik
          </p>

          {/* Login Button */}
          <Link 
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full bg-[#1a3b8f] hover:bg-[#153075] text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-blue-900/20 transition-transform active:scale-[0.98] uppercase tracking-wider text-sm"
          >
            Masuk Sekarang <ArrowRight size={18} />
          </Link>

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
