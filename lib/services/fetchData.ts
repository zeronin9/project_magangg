import axios from "axios";

export interface MetaPagination {
  current_page: number;
  limit: number;
  total_items: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

export const fetchData = async <T = any>(
  endpoint: string,
  page: number = 1,
  limit: number = 10,
  filters: Record<string, any> = {}
) => {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("token")
    : null;

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}${endpoint}?${params.toString()}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );

  // Explicitly type the response structure
  const response = res.data as {
    meta: MetaPagination;
    data: T[];
  };

  return {
    items: response.data,
    meta: response.meta,
  };
};
