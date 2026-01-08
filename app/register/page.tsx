'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Lock, Mail, Building2, Phone, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { apiClient } from '@/lib/api'; // Import apiClient

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    fullName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // --- Validasi Frontend ---
    if (!formData.businessName.trim()) { setError('Nama bisnis wajib diisi'); return; }
    if (!formData.fullName.trim()) { setError('Nama lengkap wajib diisi'); return; }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) { setError('Email tidak valid'); return; }
    if (!formData.phone.trim()) { setError('Nomor telepon wajib diisi'); return; }
    if (!formData.username.trim()) { setError('Username wajib diisi'); return; }
    if (formData.password.length < 6) { setError('Password minimal 6 karakter'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Password tidak sama'); return; }

    setIsLoading(true);

    try {
      // 1. Siapkan Payload sesuai format Backend (src/controllers/auth.js)
      const payload = {
        business_name: formData.businessName,
        business_email: formData.email,
        business_phone: formData.phone,
        username: formData.username,
        password: formData.password,
        // Backend akan otomatis set full_name = "Owner [business_name]"
        // Jika ingin custom, backend perlu diedit dulu.
      };

      // 2. Panggil API Register yang Asli
      // Asumsi route backend di-mount di /auth
      await apiClient.post('/auth/register', payload);
      
      // 3. Jika sukses
      localStorage.setItem('pendingVerificationEmail', formData.email);
      localStorage.removeItem('pendingUserData'); // Tidak perlu simpan data sensitif
      
      router.push('/verify-email');

    } catch (err: any) {
      console.error('Registration error:', err);
      // Tampilkan pesan error dari backend (misal: "Username sudah digunakan")
      setError(err.message || 'Pendaftaran gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* BAGIAN KIRI: FORM REGISTER */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center bg-white relative overflow-y-auto man-h-[600px]">
          
          <div className="flex items-center gap-2.5 mb-5">
            <div className="relative w-9 h-9 flex-shrink-0">
              <Image 
                src="/images/LOGO HOREKA (1).png" 
                alt="Horeka Logo" 
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg font-bold text-black tracking-wide">Horeka POS+</span>
          </div>

          <div className="mb-4">
            <h1 className="text-xl font-extrabold text-gray-900 mb-1">Daftar Akun Baru</h1>
            <p className="text-gray-500 font-medium text-xs">Lengkapi data untuk membuat akun:</p>
          </div>

          {error && (
            <div className="mb-3 p-2 bg-red-50 border-l-4 border-red-500 text-red-600 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-2.5">
            {/* Input field components tetap sama seperti desain Anda */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Building2 size={16} /></div>
              <input type="text" value={formData.businessName} onChange={(e) => handleInputChange('businessName', e.target.value)} required className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-300 focus:border-blue-500 outline-none" placeholder="Nama Bisnis" />
            </div>
            
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><User size={16} /></div>
              <input type="text" value={formData.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} required className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-300 focus:border-blue-500 outline-none" placeholder="Nama Lengkap" />
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Mail size={16} /></div>
              <input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} required className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-300 focus:border-blue-500 outline-none" placeholder="Email" />
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Phone size={16} /></div>
              <input type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} required className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-300 focus:border-blue-500 outline-none" placeholder="Nomor Telepon" />
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><User size={16} /></div>
              <input type="text" value={formData.username} onChange={(e) => handleInputChange('username', e.target.value)} required className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-300 focus:border-blue-500 outline-none" placeholder="Username" />
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={16} /></div>
              <input type="password" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} required className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-300 focus:border-blue-500 outline-none" placeholder="Password" />
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={16} /></div>
              <input type="password" value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} required className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-300 focus:border-blue-500 outline-none" placeholder="Konfirmasi Password" />
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-[#1a3b8f] hover:bg-[#153075] text-white font-bold py-2.5 rounded-xl shadow-md mt-3 uppercase tracking-wider text-sm disabled:opacity-50">
              {isLoading ? <div className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Processing...</div> : 'DAFTAR'}
            </button>
          </form>

          <div className="mt-4 text-center">
             <p className="text-xs text-gray-500">Sudah punya akun? <Link href="/login" className="text-[#1a3b8f] hover:underline font-semibold">Masuk di sini</Link></p>
             <p className="text-xs text-gray-500 mt-1"><Link href="/" className="text-[#1a3b8f] hover:underline font-semibold">Kembali ke Home</Link></p>
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
            Horeka POS+
            </h2>
            <p className="text-lg text-blue-100 font-light leading-relaxed drop-shadow-md mb-8">
              Bergabunglah dengan ribuan bisnis yang telah mempercayai kami
            </p>
            
            {/* Benefits List */}
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="bg-white/20 rounded-full p-1 mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white">Harga Paket Terjangkau</p>
                  <p className="text-sm text-blue-100">Pembayaran mudah dan aman</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-white/20 rounded-full p-1 mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white">Setup Mudah</p>
                  <p className="text-sm text-blue-100">Mulai dalam 5 menit</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-white/20 rounded-full p-1 mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white">Support 24/7</p>
                  <p className="text-sm text-blue-100">Tim kami siap membantu</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}