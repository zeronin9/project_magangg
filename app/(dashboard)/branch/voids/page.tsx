'use client';

import { useState, useEffect } from 'react';
import { branchPageAPI } from '@/lib/api/branch';
import { VoidRequest } from '@/types';
import { Ban, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function VoidRequestsPage() {
  const [requests, setRequests] = useState<VoidRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await branchPageAPI.getVoidRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching void requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (transactionId: string, approve: boolean) => {
    if (!confirm(approve ? 'Setujui pembatalan transaksi ini?' : 'Tolak permintaan void?')) return;
    
    try {
      await branchPageAPI.reviewVoid(transactionId, approve);
      alert(approve ? 'Void disetujui' : 'Void ditolak');
      fetchRequests();
    } catch (error: any) {
      alert(error.message || 'Gagal memproses permintaan');
    }
  };

  if (isLoading) return <TableSkeleton rows={5} />;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Permintaan Void</h2>
          <p className="text-muted-foreground">Persetujuan pembatalan transaksi dari kasir</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Permintaan</CardTitle>
          <CardDescription>Transaksi yang menunggu persetujuan pembatalan</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="mx-auto h-12 w-12 mb-3 text-green-500/50" />
              <p>Tidak ada permintaan void yang tertunda.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>ID Transaksi</TableHead>
                  <TableHead>Kasir Pemohon</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.transaction_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {new Date(req.created_at).toLocaleString('id-ID')}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{req.transaction_id}</TableCell>
                    <TableCell>{req.requested_by}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-destructive border-destructive/50 bg-destructive/10">
                        {req.void_reason}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleReview(req.transaction_id, false)}
                      >
                        <XCircle className="mr-2 h-4 w-4" /> Tolak
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={() => handleReview(req.transaction_id, true)}
                      >
                        <Ban className="mr-2 h-4 w-4" /> Setujui Void
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}