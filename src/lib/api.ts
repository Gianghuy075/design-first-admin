const RAW_BASE = (typeof window !== "undefined" && localStorage.getItem("hm_api_base")) || "http://localhost:3000/api";
export const API_BASE = RAW_BASE.replace(/\/$/, "");

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hm_token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("hm_token", token);
  else localStorage.removeItem("hm_token");
}

export function setApiBase(url: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("hm_api_base", url);
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: { total: number; page: number; limit: number };
  error?: string;
  statusCode?: number;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { auth?: boolean; query?: Record<string, string | number | boolean | undefined> } = {},
): Promise<ApiResponse<T>> {
  const { auth = true, query, headers, ...rest } = options;
  const base = (typeof window !== "undefined" && localStorage.getItem("hm_api_base")) || API_BASE;
  let url = base.replace(/\/$/, "") + path;
  if (query) {
    const qs = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== "" && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string> | undefined),
  };
  if (auth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...rest, headers: finalHeaders });
  let body: ApiResponse<T>;
  try {
    body = await res.json();
  } catch {
    throw new Error(`Invalid response (${res.status})`);
  }
  if (!res.ok || body.success === false) {
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return body;
}