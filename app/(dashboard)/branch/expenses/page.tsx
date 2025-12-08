'use client';

import { useState, useEffect } from 'react';
import { branchPageAPI } from '@/lib/api/branch';
import { Expense } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { Plus, Search, Calendar, FileText, DollarSign } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await branchPageAPI.getExpenses();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await branchPageAPI.createExpense({
        ...formData,
        amount: Number(formData.amount)
      });
      alert('Pengeluaran dicatat!');
      setIsAddOpen(false);
      loadData();
      setFormData({ description: '', amount: '', expense_date: new Date().toISOString().split('T')[0] });
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pengeluaran');
    }
  };

  const filteredExpenses = expenses.filter(ex => 
    ex.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpense = filteredExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

  if (isLoading) return <TableSkeleton rows={8} showButton />;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pengeluaran</h2>
          <p className="text-muted-foreground">Catat biaya operasional cabang</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}><Plus className="mr-2 h-4 w-4"/> Catat Pengeluaran</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(totalExpense)}</div>
            <p className="text-xs text-muted-foreground">Dari {filteredExpenses.length} transaksi ditampilkan</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Riwayat Pengeluaran</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari deskripsi..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead>Deskripsi</TableHead><TableHead className="text-right">Jumlah</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredExpenses.map(ex => (
                <TableRow key={ex.expense_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(ex.expense_date).toLocaleDateString('id-ID')}
                    </div>
                  </TableCell>
                  <TableCell>{ex.description}</TableCell>
                  <TableCell className="text-right font-medium">{formatRupiah(ex.amount)}</TableCell>
                </TableRow>
              ))}
              {filteredExpenses.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Belum ada data pengeluaran</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <form onSubmit={handleAdd}>
            <DialogHeader><DialogTitle>Catat Pengeluaran Baru</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Deskripsi</Label><Input required placeholder="Contoh: Beli Es Batu" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
              <div className="grid gap-2"><Label>Jumlah (Rp)</Label><Input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div>
              <div className="grid gap-2"><Label>Tanggal</Label><Input type="date" required value={formData.expense_date} onChange={e => setFormData({...formData, expense_date: e.target.value})} /></div>
            </div>
            <DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}