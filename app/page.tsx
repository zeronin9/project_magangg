import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, BarChart3, Users, Receipt, Clock, Shield, Smartphone } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Receipt className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">HOREKA POS+</h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Fitur
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Harga
            </Link>
            <Link href="#about" className="text-sm font-medium hover:text-primary transition-colors">
              Tentang
            </Link>
          </nav>
          <div className="flex space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Masuk</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Daftar Sekarang</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
            Kelola Restoran Anda dengan <span className="text-primary">HOREKA POS+</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sistem Point of Sale modern untuk restoran, cafe, dan bisnis kuliner Anda. 
            Mudah digunakan, lengkap, dan terpercaya.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button size="lg" asChild>
              <Link href="/register">
                Mulai Gratis <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Lihat Fitur</Link>
            </Button>
          </div>
          <div className="pt-8 text-sm text-muted-foreground">
            <p>✨ Gratis 30 hari trial • Tidak perlu kartu kredit • Setup 5 menit</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">Fitur Unggulan</h3>
            <p className="text-muted-foreground text-lg">
              Semua yang Anda butuhkan untuk mengelola bisnis restoran
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20 bg-secondary/30 rounded-3xl my-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">Harga Terjangkau</h3>
            <p className="text-muted-foreground text-lg">
              Pilih paket yang sesuai dengan kebutuhan bisnis Anda
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <PricingCard 
              name="Starter"
              price="Gratis"
              period="30 hari trial"
              features={[
                "1 Outlet",
                "Unlimited Transaksi",
                "Laporan Basic",
                "Printer Support",
                "Email Support"
              ]}
            />
            <PricingCard 
              name="Professional"
              price="Rp 299.000"
              period="per bulan"
              featured
              features={[
                "3 Outlet",
                "Unlimited Transaksi",
                "Laporan Lengkap",
                "Multi Printer",
                "Priority Support",
                "Backup Otomatis"
              ]}
            />
            <PricingCard 
              name="Enterprise"
              price="Custom"
              period="hubungi kami"
              features={[
                "Unlimited Outlet",
                "Unlimited Transaksi",
                "Advanced Analytics",
                "API Integration",
                "24/7 Support",
                "Custom Features"
              ]}
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">Tentang HOREKA POS+</h3>
          <p className="text-lg text-muted-foreground mb-4">
            HOREKA POS+ adalah solusi Point of Sale terlengkap untuk industri Hotel, Restaurant, dan Catering. 
            Dikembangkan dengan teknologi modern untuk membantu bisnis kuliner Anda berkembang.
          </p>
          <p className="text-lg text-muted-foreground">
            Dengan pengalaman melayani ribuan restoran di seluruh Indonesia, kami memahami kebutuhan bisnis Anda 
            dan berkomitmen untuk memberikan layanan terbaik.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-primary text-primary-foreground rounded-3xl p-12 text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Siap Meningkatkan Bisnis Anda?
          </h3>
          <p className="text-lg mb-8 opacity-90">
            Bergabunglah dengan ribuan restoran yang telah mempercayai HOREKA POS+
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register">
              Daftar Gratis Sekarang <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Receipt className="h-6 w-6 text-primary" />
              <span className="font-semibold">HOREKA POS+</span>
            </div>
            <p className="text-sm text-muted-foreground">
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
    <div className="bg-card p-6 rounded-xl border hover:shadow-lg transition-shadow">
      <div className="text-primary mb-4">{icon}</div>
      <h4 className="text-xl font-semibold mb-2">{title}</h4>
      <p className="text-muted-foreground">{description}</p>
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
    <div className={`bg-card p-8 rounded-xl border-2 ${featured ? 'border-primary shadow-xl scale-105' : 'border-border'}`}>
      {featured && (
        <div className="bg-primary text-primary-foreground text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
          Paling Populer
        </div>
      )}
      <h4 className="text-2xl font-bold mb-2">{name}</h4>
      <div className="mb-6">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-muted-foreground ml-2">/{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button className="w-full" variant={featured ? 'default' : 'outline'} asChild>
        <Link href="/register">Pilih Paket</Link>
      </Button>
    </div>
  );
}
