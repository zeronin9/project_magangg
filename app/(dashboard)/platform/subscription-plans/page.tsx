'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { formatRupiah } from '@/lib/formatters';
import { SubscriptionPlan } from '@/types';
import { Plus, Loader2, Package, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    plan_name: '',
    price: '',
    branch_limit: '',
    device_limit: '',
    duration_months: '',
    description: ''
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const data = await fetchWithAuth('/subscription-plan');
      setPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      alert('Gagal mengambil data paket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        plan_name: formData.plan_name,
        price: Number(formData.price),
        branch_limit: Number(formData.branch_limit),
        device_limit: Number(formData.device_limit),
        duration_months: Number(formData.duration_months),
        description: formData.description
      };

      if (editingPlan) {
        await fetchWithAuth(`/subscription-plan/${editingPlan.plan_id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        alert('Paket berhasil diperbarui');
      } else {
        await fetchWithAuth('/subscription-plan', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('Paket berhasil dibuat');
      }
      
      setIsModalOpen(false);
      setEditingPlan(null);
      fetchPlans();
      resetForm();
    } catch (error: any) {
      alert(error.message || 'Terjadi kesalahan');
    }
  };

  const resetForm = () => {
    setFormData({
      plan_name: '', 
      price: '', 
      branch_limit: '', 
      device_limit: '', 
      duration_months: '', 
      description: ''
    });
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      plan_name: plan.plan_name,
      price: plan.price.toString(),
      branch_limit: plan.branch_limit.toString(),
      device_limit: plan.device_limit.toString(),
      duration_months: plan.duration_months.toString(),
      description: plan.description
    });
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingPlan(null);
    resetForm();
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <Loader2 size={36} className="animate-spin text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Memuat data paket...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6 sm:pb-10 px-4 sm:px-0">
      
      {/* HEADER */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Paket Langganan</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Kelola paket yang akan ditawarkan ke mitra
          </p>
        </div>
        
        {/* Dialog Buat Paket Baru */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={openCreate}
              variant="outline"
              className="bg-gradient-to-r from-gray-100 to-gray-100 text-gray-800 hover:from-gray-200 hover:to-gray-200 border-gray-400 font-semibold w-full sm:w-auto text-sm"
              size="sm"
            >
              <Plus size={18} className="mr-2" />
              Buat Paket Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-4">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  {editingPlan ? "Edit Paket" : "Buat Paket Baru"}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {editingPlan 
                    ? "Perbarui informasi paket langganan di bawah ini." 
                    : "Isi formulir untuk membuat paket langganan baru."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="plan_name" className="text-sm">
                    Nama Paket <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="plan_name"
                    name="plan_name"
                    type="text"
                    required
                    value={formData.plan_name}
                    onChange={handleChange}
                    placeholder="Contoh: Paket Premium"
                    className="text-sm"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="price" className="text-sm">
                    Harga (Rp) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="1500000"
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="branch_limit" className="text-xs sm:text-sm">
                      Limit Cabang <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="branch_limit"
                      name="branch_limit"
                      type="number"
                      required
                      min="1"
                      value={formData.branch_limit}
                      onChange={handleChange}
                      className="text-sm"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="device_limit" className="text-xs sm:text-sm">
                      Limit Device <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="device_limit"
                      name="device_limit"
                      type="number"
                      required
                      min="1"
                      value={formData.device_limit}
                      onChange={handleChange}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="duration_months" className="text-sm">
                    Durasi (Bulan) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="duration_months"
                    name="duration_months"
                    type="number"
                    required
                    min="1"
                    max="60"
                    value={formData.duration_months}
                    onChange={handleChange}
                    placeholder="Masukkan durasi dalam bulan (contoh: 12)"
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Masukkan durasi dalam bulan (minimal 1 bulan, maksimal 60 bulan)
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-sm">
                    Deskripsi
                  </Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Deskripsi singkat paket (opsional)"
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="w-full sm:w-auto text-sm">
                    Batal
                  </Button>
                </DialogClose>
                <Button type="submit" className="w-full sm:w-auto text-sm">
                  {editingPlan ? 'Update Paket' : 'Buat Paket'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {plans.length === 0 ? (
        <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-gray-200 text-center">
          <Package size={48} className="sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Belum Ada Paket Langganan</h3>
          <p className="text-gray-500 mb-6 text-sm sm:text-base">Buat paket langganan pertama untuk mitra Anda</p>
          <Button
            onClick={openCreate}
            variant="outline"
            className="bg-gray-100 text-gray-800 hover:bg-gray-400 hover:text-white border-gray-300 text-sm"
            size="sm"
          >
            <Plus size={18} className="mr-2" />
            Buat Paket Sekarang
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {plans.map((plan) => (
            <div 
              key={plan.plan_id} 
              className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all flex flex-col h-full"
            >
              {/* Content wrapper - flex-1 to push button to bottom */}
              <div className="flex-1 flex flex-col">
                {/* Header Card */}
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 break-words">{plan.plan_name}</h3>
                    <span className="inline-block bg-gray-100 text-gray-700 text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full">
                      {plan.duration_months} Bulan
                    </span>
                  </div>
                </div>
                
                {/* Price */}
                <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200">
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800 break-words">
                    {formatRupiah(plan.price)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">per {plan.duration_months} bulan</p>
                </div>

                {/* Features - flex-1 to take remaining space */}
                <div className="flex-1">
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center text-sm text-gray-700">
                      <span className="text-green-500 mr-2">✓</span>
                      <span><strong>{plan.branch_limit}</strong> Cabang</span>
                    </li>
                    <li className="flex items-center text-sm text-gray-700">
                      <span className="text-green-500 mr-2">✓</span>
                      <span><strong>{plan.device_limit}</strong> Perangkat/Cabang</span>
                    </li>
                    {plan.description && (
                      <li className="text-xs text-gray-500 italic pt-2 border-t border-gray-100 mt-2 break-words">
                        {plan.description}
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Edit Button - always at bottom */}
              <Button
                onClick={() => openEdit(plan)}
                variant="outline"
                className="w-full bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200 font-semibold text-sm mt-4"
                size="sm"
              >
                <Edit2 size={14} className="mr-2" />
                Edit Paket
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
