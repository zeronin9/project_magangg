'use client';

import { useState, useEffect } from 'react';
import { branchPageAPI } from '@/lib/api/branch';
import { DiscountRule } from '@/types';
import { Plus, Search, Percent, Settings2, Globe, Building2, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function BranchDiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountRule | null>(null);

  const [formData, setFormData] = useState({
    discount_name: '', discount_type: 'PERCENTAGE', value: '', start_date: '', end_date: ''
  });
  const [overrideForm, setOverrideForm] = useState({ is_active: true, value: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await branchPageAPI.getDiscounts();
      setDiscounts(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleAddLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await branchPageAPI.createLocalDiscount({
        ...formData,
        value: Number(formData.value)
      });
      alert('Diskon lokal dibuat!');
      setIsAddOpen(false);
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiscount) return;
    try {
      await branchPageAPI.overrideDiscount(selectedDiscount.discount_rule_id, {
        is_active_at_branch: overrideForm.is_active,
        value: overrideForm.value ? Number(overrideForm.value) : undefined
      });
      alert('Pengaturan diskon pusat diupdate!');
      setIsOverrideOpen(false);
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteLocal = async (id: string) => {
    if(!confirm("Hapus diskon lokal ini?")) return;
    try {
      await branchPageAPI.deleteLocalDiscount(id);
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const openOverride = (disc: DiscountRule) => {
    setSelectedDiscount(disc);
    setOverrideForm({ is_active: true, value: String(disc.value) });
    setIsOverrideOpen(true);
  };

  if (isLoading) return <TableSkeleton rows={5} showButton />;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Diskon & Promo</h2>
          <p className="text-muted-foreground">Atur promo lokal atau sesuaikan promo pusat</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}><Plus className="mr-2 h-4 w-4"/> Buat Promo Lokal</Button>
      </div>

      <div className="grid gap-4 grid-cols-1 @lg:grid-cols-2 @xl:grid-cols-3">
        {discounts.map(disc => {
          const isLocal = !!disc.branch_id;
          return (
            <Card key={disc.discount_rule_id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant={isLocal ? 'secondary' : 'default'}>
                    {isLocal ? <><Building2 className="mr-1 h-3 w-3"/> Lokal</> : <><Globe className="mr-1 h-3 w-3"/> General</>}
                  </Badge>
                  {isLocal && <Button variant="ghost" size="icon" onClick={() => handleDeleteLocal(disc.discount_rule_id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>}
                </div>
                <CardTitle className="mt-2">{disc.discount_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-primary">{disc.value}</span>
                  <span className="text-muted-foreground">{disc.discount_type === 'PERCENTAGE' ? '%' : 'IDR'}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Berlaku: {new Date(disc.start_date).toLocaleDateString()} - {new Date(disc.end_date).toLocaleDateString()}
                </div>
                {!isLocal && (
                  <Button variant="outline" className="w-full" onClick={() => openOverride(disc)}>
                    <Settings2 className="mr-2 h-4 w-4"/> Atur Ketersediaan
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add Local Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <form onSubmit={handleAddLocal}>
            <DialogHeader><DialogTitle>Buat Diskon Lokal</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Nama Promo</Label><Input required value={formData.discount_name} onChange={e => setFormData({...formData, discount_name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Tipe</Label>
                  <Select onValueChange={v => setFormData({...formData, discount_type: v})}>
                    <SelectTrigger><SelectValue placeholder="Pilih Tipe"/></SelectTrigger>
                    <SelectContent><SelectItem value="PERCENTAGE">Persen (%)</SelectItem><SelectItem value="FIXED_AMOUNT">Nominal (Rp)</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>Nilai</Label><Input type="number" required value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Mulai</Label><Input type="date" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} /></div>
                <div className="grid gap-2"><Label>Selesai</Label><Input type="date" required value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} /></div>
              </div>
            </div>
            <DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Override Modal */}
      <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
        <DialogContent>
          <form onSubmit={handleOverride}>
            <DialogHeader><DialogTitle>Atur Promo Pusat: {selectedDiscount?.discount_name}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-between border p-3 rounded">
                <Label>Aktifkan di Cabang ini?</Label>
                <Switch checked={overrideForm.is_active} onCheckedChange={c => setOverrideForm({...overrideForm, is_active: c})} />
              </div>
              <div className="grid gap-2">
                <Label>Override Nilai (Opsional)</Label>
                <Input type="number" placeholder={`Nilai asli: ${selectedDiscount?.value}`} value={overrideForm.value} onChange={e => setOverrideForm({...overrideForm, value: e.target.value})} />
                <p className="text-xs text-muted-foreground">Kosongkan jika ingin mengikuti nilai pusat.</p>
              </div>
            </div>
            <DialogFooter><Button type="submit">Simpan Pengaturan</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}