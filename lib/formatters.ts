// lib/formatters.ts
export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Alternatif tanpa symbol Rp (hanya angka dengan separator)
export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('id-ID').format(amount);
};
