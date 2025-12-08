'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { Partner, SubscriptionPlan, SubscriptionOrder, PartnerSubscription } from '@/types';
import { Plus, Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { CustomAlertDialog } from "@/components/ui/custom-alert-dialog";

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<SubscriptionOrder[]>([]);
  const [subscriptions, setSubscriptions] = useState<PartnerSubscription[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<PartnerSubscription | null>(null);

  const [manualForm, setManualForm] = useState({ partner_id: '', plan_id: '', start_date: '', payment_status: 'Paid' });
  const [editForm, setEditForm] = useState({ end_date: '', payment_status: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ordersData, subsData, partnersData, plansData] = await Promise.all([
        fetchWithAuth('/partner-subscription/orders'),
        fetchWithAuth('/partner-subscription'),
        fetchWithAuth('/partner'), 
        fetchWithAuth('/subscription-plan')
      ]);

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      // Subs returns { summary, data: [] }
      setSubscriptions(subsData.data || (Array.isArray(subsData) ? subsData : []));
      setPartners(Array.isArray(partnersData) ? partnersData : []);
      setPlans(Array.isArray(plansData) ? plansData : []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (orderId: string) => {
    if (!confirm('Terima pesanan dan aktifkan langganan?')) return;
    try {
      await fetchWithAuth(`/partner-subscription/order/${orderId}/approve`, { method: 'POST' });
      alert('Pesanan disetujui!');
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const handleReject = async (orderId: string) => {
    if (!confirm('Tolak pesanan ini?')) return;
    try {
      await fetchWithAuth(`/partner-subscription/order/${orderId}/reject`, { method: 'POST' });
      alert('Pesanan ditolak.');
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const handleManualAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/partner-subscription', {
        method: 'POST',
        body: JSON.stringify({
          ...manualForm,
          start_date: manualForm.start_date || new Date().toISOString()
        }),
      });
      alert('Langganan manual berhasil dibuat!');
      setIsAssignOpen(false);
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const openEdit = (sub: PartnerSubscription) => {
    setEditingSubscription(sub);
    setEditForm({
      end_date: sub.end_date ? new Date(sub.end_date).toISOString().split('T')[0] : '',
      payment_status: sub.payment_status || 'Paid'
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubscription) return;
    try {
      await fetchWithAuth(`/partner-subscription/${editingSubscription.subscription_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          end_date: new Date(editForm.end_date).toISOString(),
          payment_status: editForm.payment_status
        })
      });
      alert('Update sukses');
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async () => {
    if (!selectedSubId) return;
    try {
      await fetchWithAuth(`/partner-subscription/${selectedSubId}`, { method: 'DELETE' });
      alert('Langganan dihapus!');
      setIsDeleteOpen(false);
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  if (isLoading) return <TableSkeleton rows={8} showButton />;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Langganan & Pesanan</h2>
          <p className="text-muted-foreground">Kelola pesanan masuk dan langganan aktif</p>
        </div>
        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary"><Plus className="mr-2 h-4 w-4"/> Manual Assign</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleManualAssign}>
              <DialogHeader><DialogTitle>Assign Langganan Manual</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Pilih Mitra</Label>
                  <Select onValueChange={(v) => setManualForm({...manualForm, partner_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Pilih Mitra" /></SelectTrigger>
                    <SelectContent>
                      {partners.map(p => <SelectItem key={p.partner_id} value={p.partner_id}>{p.business_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Pilih Paket</Label>
                  <Select onValueChange={(v) => setManualForm({...manualForm, plan_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Pilih Paket" /></SelectTrigger>
                    <SelectContent>
                      {plans.map(p => <SelectItem key={p.plan_id} value={p.plan_id}>{p.plan_name} - {formatRupiah(p.price)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Status Bayar</Label>
                  <Select defaultValue="Paid" onValueChange={(v) => setManualForm({...manualForm, payment_status: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Unpaid">Unpaid</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button type="submit">Assign</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders" className="relative">
            Pesanan Masuk
            {orders.length > 0 && <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-red-500">{orders.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="active">Langganan Aktif</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader><CardTitle>Antrian Pesanan</CardTitle><CardDescription>Menunggu konfirmasi pembayaran</CardDescription></CardHeader>
            <CardContent>
              {orders.length === 0 ? <div className="text-center py-8 text-muted-foreground">Tidak ada pesanan baru</div> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead>Mitra</TableHead><TableHead>Paket</TableHead><TableHead>Nominal</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {orders.map(order => (
                      <TableRow key={order.order_id}>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{order.partner_name}</TableCell>
                        <TableCell>{order.plan_name}</TableCell>
                        <TableCell>{formatRupiah(Number(order.amount))}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleReject(order.order_id)}>Tolak</Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(order.order_id)}>Terima</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardHeader><CardTitle>Data Langganan</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Mitra</TableHead><TableHead>Paket</TableHead><TableHead>Periode</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {subscriptions.map(sub => (
                    <TableRow key={sub.subscription_id}>
                      <TableCell className="font-medium">{sub.partner?.business_name || 'Unknown'}</TableCell>
                      <TableCell>{sub.plan?.plan_name || sub.plan_snapshot?.plan_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(sub.start_date).toLocaleDateString()} - {new Date(sub.end_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell><Badge variant={sub.status === 'Active' ? 'default' : 'secondary'}>{sub.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(sub)}><Edit2 className="mr-2 h-4 w-4"/> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedSubId(sub.subscription_id); setIsDeleteOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/> Hapus</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader><DialogTitle>Edit Langganan</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Perpanjang Hingga</Label><Input type="date" required value={editForm.end_date} onChange={e => setEditForm({...editForm, end_date: e.target.value})} /></div>
              <div className="grid gap-2"><Label>Status Bayar</Label><Select value={editForm.payment_status} onValueChange={v => setEditForm({...editForm, payment_status: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Unpaid">Unpaid</SelectItem></SelectContent></Select></div>
            </div>
            <DialogFooter><Button type="submit">Update</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CustomAlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} title="Hapus Langganan?" description="Data akan hilang." onConfirm={handleDelete} confirmText="Hapus" variant="destructive" />
    </div>
  );
}