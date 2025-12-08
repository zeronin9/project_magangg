'use client';

import { useState, useEffect } from 'react';
import { branchPageAPI } from '@/lib/api/branch';
import { CashierAccount, PinOperator } from '@/types';
import { Tablet, User, Plus, Trash2, Edit2, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function CashierManagementPage() {
  const [activeTab, setActiveTab] = useState('accounts');
  const [accounts, setAccounts] = useState<CashierAccount[]>([]);
  const [operators, setOperators] = useState<PinOperator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddPinOpen, setIsAddPinOpen] = useState(false);

  // Forms
  const [accountForm, setAccountForm] = useState({ full_name: '', username: '', password: '' });
  const [pinForm, setPinForm] = useState({ full_name: '', pin: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [accData, opData] = await Promise.all([
        branchPageAPI.getCashierAccounts(), // Doc 2.2
        branchPageAPI.getPinOperators()     // Doc 3.2
      ]);
      setAccounts(Array.isArray(accData) ? accData : []);
      setOperators(Array.isArray(opData) ? opData : []);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await branchPageAPI.createCashierAccount(accountForm); // Doc 2.1
      alert('Akun kasir dibuat!');
      setIsAddAccountOpen(false);
      loadData();
      setAccountForm({ full_name: '', username: '', password: '' });
    } catch (err: any) { alert(err.message); }
  };

  const handleAddPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if(pinForm.pin.length < 4) return alert('PIN minimal 4 digit');
    try {
      await branchPageAPI.createPinOperator(pinForm); // Doc 3.1
      alert('Operator PIN dibuat!');
      setIsAddPinOpen(false);
      loadData();
      setPinForm({ full_name: '', pin: '' });
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteAccount = async (id: string) => {
    if(!confirm("Non-aktifkan akun ini?")) return;
    try {
      await branchPageAPI.deleteCashierAccount(id); // Doc 2.4
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  if (isLoading) return <TableSkeleton rows={5} showButton />;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Kasir & Staf</h2>
          <p className="text-muted-foreground">Kelola akses tablet dan PIN karyawan</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts"><Tablet className="mr-2 h-4 w-4"/> Akun Login Tablet</TabsTrigger>
          <TabsTrigger value="operators"><User className="mr-2 h-4 w-4"/> Operator PIN</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Akun Login</CardTitle><CardDescription>Untuk login awal di aplikasi POS</CardDescription></div>
              <Button onClick={() => setIsAddAccountOpen(true)}><Plus className="mr-2 h-4 w-4"/> Tambah Akun</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Nama Perangkat/Posisi</TableHead><TableHead>Username</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {accounts.map(acc => (
                    <TableRow key={acc.user_id}>
                      <TableCell className="font-medium">{acc.full_name}</TableCell>
                      <TableCell>{acc.username}</TableCell>
                      <TableCell><Badge variant={acc.is_active ? 'default' : 'secondary'}>{acc.is_active ? 'Aktif' : 'Non-aktif'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteAccount(acc.user_id)} className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operators">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Operator PIN</CardTitle><CardDescription>PIN individu untuk staff saat transaksi</CardDescription></div>
              <Button onClick={() => setIsAddPinOpen(true)}><Plus className="mr-2 h-4 w-4"/> Tambah Staf</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Nama Staf</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {operators.map(op => (
                    <TableRow key={op.cashier_id}>
                      <TableCell className="font-medium">{op.full_name}</TableCell>
                      <TableCell><Badge variant={op.is_active ? 'default' : 'secondary'}>{op.is_active ? 'Aktif' : 'Non-aktif'}</Badge></TableCell>
                      <TableCell className="text-right">
                        {/* Implement edit/delete logic similar to accounts */}
                        <Button variant="ghost" size="sm"><Edit2 className="h-4 w-4"/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
        <DialogContent>
          <form onSubmit={handleAddAccount}>
            <DialogHeader><DialogTitle>Tambah Akun Tablet</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Nama (Misal: Kasir Depan)</Label><Input required value={accountForm.full_name} onChange={e => setAccountForm({...accountForm, full_name: e.target.value})} /></div>
              <div className="grid gap-2"><Label>Username</Label><Input required value={accountForm.username} onChange={e => setAccountForm({...accountForm, username: e.target.value})} /></div>
              <div className="grid gap-2"><Label>Password</Label><Input type="password" required value={accountForm.password} onChange={e => setAccountForm({...accountForm, password: e.target.value})} /></div>
            </div>
            <DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddPinOpen} onOpenChange={setIsAddPinOpen}>
        <DialogContent>
          <form onSubmit={handleAddPin}>
            <DialogHeader><DialogTitle>Tambah Operator PIN</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Nama Staf</Label><Input required value={pinForm.full_name} onChange={e => setPinForm({...pinForm, full_name: e.target.value})} /></div>
              <div className="grid gap-2"><Label>PIN (4-6 Angka)</Label><Input type="number" required maxLength={6} minLength={4} value={pinForm.pin} onChange={e => setPinForm({...pinForm, pin: e.target.value})} /></div>
            </div>
            <DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}