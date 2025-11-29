// app/admin/mitra/branch/page.tsx
"use client"
import { useState, useEffect } from "react"
import { BranchPlus, Edit, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

interface Branch {
  branch_id: string
  branch_name: string
  address: string
  phone_number: string
}

export default function BranchPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const { toast } = useToast()

  const filteredBranches = branches.filter((branch) =>
    branch.branch_name.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      // TODO: Replace with real API call
      setBranches([
        {
          branch_id: "1",
          branch_name: "Cabang Jakarta Pusat",
          address: "Jl. MH Thamrin No. 1",
          phone_number: "021-1234567",
        },
        {
          branch_id: "2",
          branch_name: "Cabang Bandung",
          address: "Jl. Asia Afrika No. 123",
          phone_number: "022-9876543",
        },
      ])
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data cabang",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBranch = async (formData: FormData) => {
    try {
      // TODO: POST /api/branch
      toast({
        title: "Sukses",
        description: "Cabang berhasil dibuat",
      })
      setShowDialog(false)
      fetchBranches()
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal membuat cabang",
        variant: "destructive",
      })
    }
  }

  const handleEditBranch = async (formData: FormData) => {
    try {
      // TODO: PUT /api/branch/:id
      toast({
        title: "Sukses",
        description: "Cabang berhasil diupdate",
      })
      setShowDialog(false)
      fetchBranches()
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal update cabang",
        variant: "destructive",
      })
    }
  }

  const handleDeleteBranch = async (id: string) => {
    if (!confirm("Yakin hapus cabang ini?")) return
    try {
      // TODO: DELETE /api/branch/:id
      toast({
        title: "Sukses",
        description: "Cabang berhasil dihapus",
      })
      fetchBranches()
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal hapus cabang",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cabang</h2>
          <p className="text-muted-foreground">
            Kelola semua cabang bisnis Anda
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <BranchPlus className="mr-2 h-4 w-4" />
              Tambah Cabang
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <div>
              <h3 className="text-lg font-semibold">
                {editingBranch ? "Edit Cabang" : "Tambah Cabang"}
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  if (editingBranch) {
                    handleEditBranch(formData)
                  } else {
                    handleCreateBranch(formData)
                  }
                }}
                className="space-y-4 mt-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="branch_name">Nama Cabang</Label>
                  <Input
                    id="branch_name"
                    name="branch_name"
                    defaultValue={editingBranch?.branch_name || ""}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={editingBranch?.address || ""}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">No Telepon</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    defaultValue={editingBranch?.phone_number || ""}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {editingBranch ? "Update" : "Buat"}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Daftar Cabang</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari cabang..."
              className="w-64 pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="h-12 w-12 bg-muted animate-pulse rounded-md" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-48" />
                    <div className="h-3 bg-muted animate-pulse rounded w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead className="w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.map((branch) => (
                  <TableRow key={branch.branch_id}>
                    <TableCell className="font-medium">{branch.branch_name}</TableCell>
                    <TableCell>{branch.address}</TableCell>
                    <TableCell>{branch.phone_number}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingBranch(branch)
                            setShowDialog(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteBranch(branch.branch_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
