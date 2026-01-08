'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { Partner, SubscriptionPlan, SubscriptionOrder, PartnerSubscription } from '@/types';
import { Plus, Edit2, MoreHorizontal, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

// IMPORT PAGINATION SHADCN
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<SubscriptionOrder[]>([]);
  const [subscriptions, setSubscriptions] = useState<PartnerSubscription[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<PartnerSubscription | null>(null);

  const [manualForm, setManualForm] = useState({ partner_id: '', plan_id: '', start_date: '', payment_status: 'Paid' });
  const [editForm, setEditForm] = useState({ end_date: '', payment_status: '' });

  // --- PROCESSING STATES ---
  // processingId: Menyimpan ID order yang sedang di proses (untuk tombol di tabel)
  const [processingId, setProcessingId] = useState<string | null>(null);
  // isFormProcessing: Untuk tombol di dalam modal (Assign/Update)
  const [isFormProcessing, setIsFormProcessing] = useState(false);

  // --- PAGINATION STATE ---
  const ITEMS_PER_PAGE = 10;
  const [ordersPage, setOrdersPage] = useState(1);
  const [subsPage, setSubsPage] = useState(1);

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
      setSubscriptions(subsData.data || (Array.isArray(subsData) ? subsData : []));
      setPartners(Array.isArray(partnersData) ? partnersData : []);
      setPlans(Array.isArray(plansData) ? plansData : []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getSubscriptionStatus = (sub: any) => {
    const now = new Date();
    const startDate = new Date(sub.start_date);
    const endDate = new Date(sub.end_date);

    if (sub.payment_status && sub.payment_status !== 'Paid') return sub.payment_status;
    if (now > endDate) return 'Expired';
    if (now < startDate) return 'Scheduled';
    return 'Active';
  };

  // --- ACTION HANDLERS WITH DELAY ---

  const handleApprove = async (orderId: string) => {
    if (processingId) return; // Mencegah double action
    if (!confirm('Terima pesanan dan aktifkan langganan?')) return;
    
    setProcessingId(orderId); // Set loading state untuk baris ini

    try {
      await Promise.all([
        fetchWithAuth(`/partner-subscription/order/${orderId}/approve`, { method: 'POST' }),
        new Promise(resolve => setTimeout(resolve, 3000)) // Delay 3 detik
      ]);
      fetchData();
    } catch (err: any) { 
      console.error(err.message); 
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (orderId: string) => {
    if (processingId) return;
    if (!confirm('Tolak pesanan ini?')) return;

    setProcessingId(orderId);

    try {
      await Promise.all([
        fetchWithAuth(`/partner-subscription/order/${orderId}/reject`, { method: 'POST' }),
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);
      fetchData();
    } catch (err: any) { 
      console.error(err.message); 
    } finally {
      setProcessingId(null);
    }
  };

  const handleManualAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormProcessing) return;

    setIsFormProcessing(true);

    try {
      await Promise.all([
        fetchWithAuth('/partner-subscription', {
          method: 'POST',
          body: {
            ...manualForm,
            start_date: manualForm.start_date || new Date().toISOString()
          },
        }),
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);
      
      setIsAssignOpen(false);
      fetchData();
    } catch (err: any) { 
      console.error(err.message); 
    } finally {
      setIsFormProcessing(false);
    }
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
    if (!editingSubscription || isFormProcessing) return;

    setIsFormProcessing(true);

    try {
      await Promise.all([
        fetchWithAuth(`/partner-subscription/${editingSubscription.subscription_id}`, {
          method: 'PUT',
          body: {
            end_date: new Date(editForm.end_date).toISOString(),
            payment_status: editForm.payment_status
          }
        }),
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);
      
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) { 
      console.error(err.message); 
    } finally {
      setIsFormProcessing(false);
    }
  };

  // --- LOGIKA DATA PAGINATION ---
  const orderLastIdx = ordersPage * ITEMS_PER_PAGE;
  const orderFirstIdx = orderLastIdx - ITEMS_PER_PAGE;
  const currentOrders = orders.slice(orderFirstIdx, orderLastIdx);
  const totalOrdersPages = Math.ceil(orders.length / ITEMS_PER_PAGE);

  const subsLastIdx = subsPage * ITEMS_PER_PAGE;
  const subsFirstIdx = subsLastIdx - ITEMS_PER_PAGE;
  const currentSubs = subscriptions.slice(subsFirstIdx, subsLastIdx);
  const totalSubsPages = Math.ceil(subscriptions.length / ITEMS_PER_PAGE);

  // --- COMPONENT RENDER PAGINATION ---
  const renderPagination = (currentPage: number, totalPages: number, setPage: (p: number) => void) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        if (currentPage <= 3) {
          pages.push(1, 2, 3, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push(1, '...', currentPage, '...', totalPages);
        }
      }
      return pages;
    };

    return (
      <Pagination className="mt-4 justify-center">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              href="#" 
              onClick={(e) => { e.preventDefault(); if (currentPage > 1) setPage(currentPage - 1); }}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          
          {getPageNumbers().map((page, idx) => (
            <PaginationItem key={idx}>
              {page === '...' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink 
                  href="#" 
                  isActive={currentPage === page}
                  onClick={(e) => { e.preventDefault(); setPage(Number(page)); }}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext 
              href="#" 
              onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setPage(currentPage + 1); }}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  if (isLoading) return <TableSkeleton rows={8} showButton />;

  const pendingOrdersCount = orders.filter(o => o.status === 'WAITING_TRANSFER').length;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Langganan & Pesanan</h2>
          <p className="text-muted-foreground">Kelola pesanan masuk dan langganan aktif</p>
        </div>
        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogTrigger asChild>
            <Button className='bg-black text-white hover:bg-gray-900' variant="secondary"><Plus className="text-white mr-2 h-4 w-4"/> Manual Assign</Button>
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
                      {plans.map(p => <SelectItem key={p.plan_id} value={p.plan_id}>{p.plan_name} - {formatRupiah(Number(p.price))}</SelectItem>)}
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
              <DialogFooter>
                <Button type="submit" disabled={isFormProcessing}>
                  {isFormProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : 'Assign'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className='w-full'>
          <TabsTrigger value="orders" className="relative">
            Pesanan Masuk
            {pendingOrdersCount > 0 && <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-red-500 text-white">{pendingOrdersCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="active">Langganan Aktif</TabsTrigger>
        </TabsList>

        {/* TAB PESANAN MASUK */}
        <TabsContent value="orders">
          <Card>
            <CardHeader><CardTitle>Antrian Pesanan</CardTitle><CardDescription>Menunggu konfirmasi pembayaran</CardDescription></CardHeader>
            <CardContent>
              {currentOrders.length === 0 ? <div className="text-center py-8 text-muted-foreground">Tidak ada riwayat pesanan</div> : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">No.</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Mitra</TableHead>
                        <TableHead>Paket</TableHead>
                        <TableHead>Nominal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentOrders.map((order, index) => (
                        <TableRow key={order.order_id}>
                          <TableCell className="text-muted-foreground">{orderFirstIdx + index + 1}</TableCell>
                          <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{order.partner_name}</TableCell>
                          <TableCell>{order.plan_name}</TableCell>
                          <TableCell>{formatRupiah(Number(order.amount))}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={order.status === 'WAITING_TRANSFER' ? 'secondary' : order.status === 'PAID' ? 'default' : 'destructive'}
                              className={order.status === 'PAID' ? 'bg-black' : 'bg-gray-100 text-black'}
                            >
                              {order.status === 'WAITING_TRANSFER' ? 'Menunggu Transfer' : order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {order.status === 'WAITING_TRANSFER' && (
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-black hover:bg-red-50" 
                                  onClick={() => handleReject(order.order_id)}
                                  disabled={processingId === order.order_id}
                                >
                                  {processingId === order.order_id ? <Loader2 className="h-3 w-3 animate-spin"/> : 'Tolak'}
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="bg-black" 
                                  onClick={() => handleApprove(order.order_id)}
                                  disabled={processingId === order.order_id}
                                >
                                  {processingId === order.order_id ? <Loader2 className="h-3 w-3 animate-spin"/> : 'Terima'}
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination Control */}
                  {renderPagination(ordersPage, totalOrdersPages, setOrdersPage)}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB LANGGANAN AKTIF */}
        <TabsContent value="active">
          <Card>
            <CardHeader><CardTitle>Data Langganan</CardTitle></CardHeader>
            <CardContent>
              {currentSubs.length === 0 ? <div className="text-center py-8 text-muted-foreground">Belum ada langganan aktif</div> : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">No.</TableHead>
                        <TableHead>Mitra</TableHead>
                        <TableHead>Paket</TableHead>
                        <TableHead>Periode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentSubs.map((sub, index) => {
                        const status = getSubscriptionStatus(sub);
                        const planName = (sub as any).subscription_plan?.plan_name || sub.plan?.plan_name || 'Unknown Plan';

                        return (
                          <TableRow key={sub.subscription_id}>
                            <TableCell className="text-muted-foreground">{subsFirstIdx + index + 1}</TableCell>
                            <TableCell className="font-medium">{sub.partner?.business_name || 'Unknown'}</TableCell>
                            <TableCell>{planName}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(sub.start_date).toLocaleDateString()} - {new Date(sub.end_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={status === 'Active' ? 'default' : 'secondary'}
                                className={status === 'Active' ? 'bg-black hover:bg-black/80' : 'bg-gray-100 text-black hover:bg-gray-200'}
                              >
                                {status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEdit(sub)}><Edit2 className="mr-2 h-4 w-4"/> Edit</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Pagination Control */}
                  {renderPagination(subsPage, totalSubsPages, setSubsPage)}
                </>
              )}
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
            <DialogFooter>
              <Button type="submit" disabled={isFormProcessing}>
                {isFormProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}