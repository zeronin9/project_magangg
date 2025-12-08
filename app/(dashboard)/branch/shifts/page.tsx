'use client';

import { useState, useEffect } from 'react';
import { branchPageAPI } from '@/lib/api/branch';
import { ShiftSchedule } from '@/types';
import { Clock, Plus, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ShiftSchedule | null>(null);
  
  const [formData, setFormData] = useState({ shift_name: '', start_time: '', end_time: '', is_active: true });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await branchPageAPI.getShifts();
      setShifts(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedShift) {
        await branchPageAPI.updateShift(selectedShift.shift_schedule_id, formData);
      } else {
        await branchPageAPI.createShift(formData);
      }
      alert('Jadwal shift disimpan!');
      setIsModalOpen(false);
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const openModal = (shift?: ShiftSchedule) => {
    if (shift) {
      setSelectedShift(shift);
      setFormData({ shift_name: shift.shift_name, start_time: shift.start_time, end_time: shift.end_time, is_active: shift.is_active });
    } else {
      setSelectedShift(null);
      setFormData({ shift_name: '', start_time: '', end_time: '', is_active: true });
    }
    setIsModalOpen(true);
  };

  if (isLoading) return <TableSkeleton rows={5} showButton />;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Jadwal Shift</h2>
          <p className="text-muted-foreground">Atur jam kerja operasional</p>
        </div>
        <Button onClick={() => openModal()}><Plus className="mr-2 h-4 w-4"/> Tambah Shift</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shifts.map(shift => (
          <Card key={shift.shift_schedule_id} className={!shift.is_active ? 'opacity-60' : ''}>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <CardTitle>{shift.shift_name}</CardTitle>
                {shift.is_active ? <CheckCircle className="h-5 w-5 text-green-500"/> : <XCircle className="h-5 w-5 text-muted-foreground"/>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-2xl font-bold mb-4">
                <Clock className="h-6 w-6 text-primary" />
                {shift.start_time} - {shift.end_time}
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => openModal(shift)}>
                <Edit2 className="mr-2 h-4 w-4" /> Edit Jadwal
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader><DialogTitle>{selectedShift ? 'Edit Shift' : 'Buat Shift Baru'}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Nama Shift</Label><Input required value={formData.shift_name} onChange={e => setFormData({...formData, shift_name: e.target.value})} placeholder="Pagi, Siang, Malam"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Jam Mulai</Label><Input type="time" required value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} /></div>
                <div className="grid gap-2"><Label>Jam Selesai</Label><Input type="time" required value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} /></div>
              </div>
              <div className="flex items-center justify-between border p-3 rounded">
                <Label>Status Aktif</Label>
                <Switch checked={formData.is_active} onCheckedChange={c => setFormData({...formData, is_active: c})} />
              </div>
            </div>
            <DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}