'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get email from localStorage
    const pendingEmail = localStorage.getItem('pendingVerificationEmail');
    const pendingBusiness = localStorage.getItem('pendingBusinessName');
    
    if (!pendingEmail) {
      router.push('/register');
      return;
    }
    
    setEmail(pendingEmail);
    setBusinessName(pendingBusiness || '');
  }, [router]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return; // Only numbers
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    setError('');

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setVerificationCode(newCode);
      // Focus last input
      const lastInput = document.getElementById('code-5');
      lastInput?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const code = verificationCode.join('');
    if (code.length !== 6) {
      setError('Kode verifikasi harus 6 digit');
      return;
    }

    setIsLoading(true);

    try {
      // Call API backend untuk verifikasi
      const response = await fetch('http://localhost:5000/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          code: code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verifikasi gagal');
      }

      // Simpan token dari response
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      // Clear pending data
      localStorage.removeItem('pendingVerificationEmail');
      localStorage.removeItem('pendingBusinessName');
      
      // Redirect ke success page
      router.push('/verify-success');
    } catch (err) {
      console.error('Verification error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Verifikasi gagal. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
      
      {/* CARD WRAPPER */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm overflow-hidden">
        
        <div className="p-8">
          
          {/* Logo Header */}
          <div className="flex items-center justify-center gap-2.5 mb-6">
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

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <Mail className="w-12 h-12 text-[#1a3b8f]" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Verifikasi Email</h1>
            <p className="text-sm text-gray-600">
              Kami telah mengirimkan kode verifikasi ke
            </p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{email}</p>
            <p className="text-xs text-gray-500 mt-2">
              Kode berlaku selama 15 menit
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-600 text-sm font-medium flex items-start gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerify}>
            
            {/* Verification Code Inputs */}
            <div className="flex justify-center gap-2 mb-6">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-12 text-center text-xl font-bold bg-gray-50 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  disabled={isLoading}
                />
              ))}
            </div>

            {/* Verify Button */}
            <button 
              type="submit" 
              disabled={isLoading || verificationCode.join('').length !== 6}
              className="w-full bg-[#1a3b8f] hover:bg-[#153075] text-white font-bold py-3 rounded-xl shadow-md shadow-blue-900/20 transition-transform active:scale-[0.98] uppercase tracking-wider text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" /> Memverifikasi...
                </div>
              ) : (
                'VERIFIKASI'
              )}
            </button>

          </form>

          {/* Info Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Tidak menerima kode? Periksa folder spam atau
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <Link href="/register" className="text-[#1a3b8f] hover:underline font-semibold">
                Daftar ulang dengan email berbeda
              </Link>
            </p>
          </div>

          {/* Helper Text */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              <Link href="/register" className="text-[#1a3b8f] hover:underline font-semibold">
                Kembali ke Registrasi
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
