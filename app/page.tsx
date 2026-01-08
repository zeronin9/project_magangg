'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle, BarChart3, Users, Receipt, Clock, Shield, Smartphone, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 flex-shrink-0">
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
              <span className="text-lg font-bold text-black tracking-wide">Horeka POS+</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-sm font-medium text-gray-700 hover:text-[#1a3b8f] transition-colors">
                Fitur
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-gray-700 hover:text-[#1a3b8f] transition-colors">
                Harga
              </Link>
              <Link href="#about" className="text-sm font-medium text-gray-700 hover:text-[#1a3b8f] transition-colors">
                Tentang
              </Link>
            </nav>

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Link 
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-[#1a3b8f] hover:text-[#153075] transition-colors"
              >
                Masuk
              </Link>
              <Link 
                href="/register"
                className="px-5 py-2 bg-[#1a3b8f] hover:bg-[#153075] text-white font-bold rounded-xl shadow-md shadow-blue-900/20 transition-transform active:scale-[0.98] text-sm"
              >
                Daftar Sekarang
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <nav className="flex flex-col space-y-3">
                <Link href="#features" className="text-sm font-medium text-gray-700 hover:text-[#1a3b8f] py-2" onClick={() => setMobileMenuOpen(false)}>
                  Fitur
                </Link>
                <Link href="#pricing" className="text-sm font-medium text-gray-700 hover:text-[#1a3b8f] py-2" onClick={() => setMobileMenuOpen(false)}>
                  Harga
                </Link>
                <Link href="#about" className="text-sm font-medium text-gray-700 hover:text-[#1a3b8f] py-2" onClick={() => setMobileMenuOpen(false)}>
                  Tentang
                </Link>
                <Link 
                  href="/login"
                  className="text-sm font-semibold text-[#1a3b8f] py-2"
                >
                  Masuk
                </Link>
                <Link 
                  href="/register"
                  className="px-5 py-2 bg-[#1a3b8f] text-white font-bold rounded-xl text-center text-sm"
                >
                  Daftar Sekarang
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1a3b8f] to-[#153075] text-white">
        <div className="container mx-auto px-4 lg:px-8 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Kelola Restoran Anda dengan <br/>
              <span className="text-white">HOREKA POS+</span>
            </h2>
            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Sistem Point of Sale modern untuk restoran, cafe, dan bisnis kuliner Anda. 
              Mudah digunakan, lengkap, dan terpercaya.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link 
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-[#1a3b8f] font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm uppercase tracking-wider"
              >
                Mulai Gratis <ArrowRight size={18} />
              </Link>
              <Link 
                href="#features"
                className="inline-flex items-center justify-center px-8 py-3 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all text-sm uppercase tracking-wider"
              >
                Lihat Fitur
              </Link>
            </div>
            <div className="pt-8 text-sm text-blue-100">
              <p>✨ Paket mulai 6 bulan • Setup mudah • Support 24/7</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Fitur Unggulan</h3>
              <p className="text-gray-600 text-lg">
                Semua yang Anda butuhkan untuk mengelola bisnis restoran
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard 
                icon={<Receipt className="h-10 w-10" />}
                title="Cetak Struk Otomatis"
                description="Cetak struk dengan printer Bluetooth atau USB. Dukungan berbagai ukuran kertas thermal."
              />
              <FeatureCard 
                icon={<BarChart3 className="h-10 w-10" />}
                title="Laporan Penjualan"
                description="Dashboard lengkap dengan grafik penjualan, laporan shift, dan analisis bisnis real-time."
              />
              <FeatureCard 
                icon={<Users className="h-10 w-10" />}
                title="Manajemen Karyawan"
                description="Kelola akses karyawan, shift kerja, dan monitoring aktivitas kasir dengan mudah."
              />
              <FeatureCard 
                icon={<Clock className="h-10 w-10" />}
                title="Shift Management"
                description="Sistem pembukaan dan penutupan shift otomatis dengan perhitungan kas yang akurat."
              />
              <FeatureCard 
                icon={<Smartphone className="h-10 w-10" />}
                title="Manajemen Menu"
                description="Kelola menu, harga, kategori, dan stok dengan antarmuka yang intuitif."
              />
              <FeatureCard 
                icon={<Shield className="h-10 w-10" />}
                title="Multi Payment"
                description="Terima pembayaran cash, debit, credit, dan e-wallet dalam satu transaksi."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-gray-100 py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Harga Terjangkau</h3>
              <p className="text-gray-600 text-lg">
                Pilih paket yang sesuai dengan kebutuhan bisnis Anda
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <PricingCard 
                name="Paket Hemat 1"
                price="Rp 500.000"
                period="6 bulan"
                features={[
                  "1 Cabang",
                  "2 Device (Kasir)",
                  "Unlimited Transaksi",
                  "Laporan Penjualan",
                  "Printer Support",
                  "Email Support"
                ]}
              />
              <PricingCard 
                name="Paket Pro"
                price="Rp 1.000.000"
                period="12 bulan"
                featured
                features={[
                  "3 Cabang",
                  "6 Device (Kasir)",
                  "Unlimited Transaksi",
                  "Laporan Lengkap",
                  "Multi Printer",
                  "Priority Support",
                  "Backup Otomatis"
                ]}
              />
              <PricingCard 
                name="Paket Mantap"
                price="Rp 1.500.000"
                period="24 bulan"
                features={[
                  "5 Cabang",
                  "10 Device (Kasir)",
                  "Unlimited Transaksi",
                  "Advanced Analytics",
                  "API Integration",
                  "24/7 Support",
                  "Custom Features"
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-white py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">Tentang HOREKA POS+</h3>
            <p className="text-lg text-gray-600 mb-4 leading-relaxed">
              HOREKA POS+ adalah solusi Point of Sale terlengkap untuk industri Hotel, Restaurant, dan Catering. 
              Dikembangkan dengan teknologi modern untuk membantu bisnis kuliner Anda berkembang.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Dengan pengalaman melayani ribuan restoran di seluruh Indonesia, kami memahami kebutuhan bisnis Anda 
              dan berkomitmen untuk memberikan layanan terbaik.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-100 py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#1a3b8f] to-[#153075] text-white rounded-2xl p-12 text-center shadow-xl">
            <h3 className="text-3xl md:text-4xl font-extrabold mb-4">
              Siap Meningkatkan Bisnis Anda?
            </h3>
            <p className="text-lg mb-8 text-blue-100">
              Bergabunglah dengan ribuan restoran yang telah mempercayai HOREKA POS+
            </p>
            <Link 
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-[#1a3b8f] font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm uppercase tracking-wider"
            >
              Daftar Gratis Sekarang <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2.5 mb-4 md:mb-0">
              <div className="relative w-6 h-6 flex-shrink-0">
                <Image 
                  src="/images/LOGO HOREKA (1).png" 
                  alt="Horeka Logo" 
                  fill
                  className="object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              <span className="font-bold text-gray-900">Horeka POS+</span>
            </div>
            <p className="text-sm text-gray-600">
              © 2026 HOREKA POS+. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-[#1a3b8f] hover:shadow-lg transition-all">
      <div className="text-[#1a3b8f] mb-4">{icon}</div>
      <h4 className="text-xl font-bold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function PricingCard({ 
  name, 
  price, 
  period, 
  features, 
  featured = false 
}: { 
  name: string; 
  price: string; 
  period: string; 
  features: string[]; 
  featured?: boolean;
}) {
  return (
    <div className={`bg-white p-8 rounded-xl shadow-md ${featured ? 'border-4 border-[#1a3b8f] shadow-xl transform scale-105' : 'border-2 border-gray-200'}`}>
      {featured && (
        <div className="bg-[#1a3b8f] text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4 uppercase tracking-wider">
          Paling Populer
        </div>
      )}
      <h4 className="text-2xl font-extrabold text-gray-900 mb-2">{name}</h4>
      <div className="mb-6">
        <span className="text-4xl font-extrabold text-gray-900">{price}</span>
        <span className="text-gray-600 ml-2 text-sm">/{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      <Link 
        href="/register"
        className={`block w-full text-center px-5 py-3 font-bold rounded-xl shadow-md transition-all text-sm uppercase tracking-wider ${
          featured 
            ? 'bg-[#1a3b8f] hover:bg-[#153075] text-white shadow-blue-900/20' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
        }`}
      >
        Pilih Paket
      </Link>
    </div>
  );
}
