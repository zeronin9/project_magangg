// lib/api/mitra.ts
import axios from "axios"

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1]
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const mitraApi = {
  // Branch
  getBranches: () => api.get("/branch"),
  createBranch: (data: { branch_name: string; address: string; phone_number: string }) =>
    api.post("/branch", data),
  updateBranch: (id: string, data: Partial<{ branch_name: string; phone_number: string }>) =>
    api.put(`/branch/${id}`, data),
  deleteBranch: (id: string) => api.delete(`/branch/${id}`),

  // Branch Admin
  getBranchAdmins: () => api.get("/branch/admin"),
  createBranchAdmin: (data: {
    full_name: string
    username: string
    password: string
    branch_id: string
  }) => api.post("/branch/admin", data),

  // Product
  getProducts: (params?: { type?: "general" | "local" }) => api.get("/product", { params }),
  createProduct: (data: FormData) => api.post("/product", data, { headers: { "Content-Type": "multipart/form-data" } }),
}
