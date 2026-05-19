import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { setToken, setApiBase, getToken, apiFetch, API_BASE } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Đăng nhập — HappyMall Admin" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [apiUrl, setApiUrl] = useState(API_BASE);
  const [token, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("hm_api_base");
      if (stored) setApiUrl(stored);
      if (getToken()) navigate({ to: "/" });
    }
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setApiBase(apiUrl.trim());
    setToken(token.trim());
    try {
      await apiFetch("/auth/me");
      navigate({ to: "/" });
    } catch (err) {
      setToken(null);
      setError(err instanceof Error ? err.message : "Token không hợp lệ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="size-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-[var(--shadow-button)]">
            <ShoppingBag className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">HappyMall</h1>
            <p className="text-sm text-muted-foreground">Admin dashboard</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-2xl p-6 shadow-[var(--shadow-card)] space-y-5"
        >
          <div>
            <h2 className="text-lg font-semibold">Đăng nhập</h2>
            <p className="text-sm text-muted-foreground">
              Dán JWT token để truy cập dashboard.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api">API URL</Label>
            <Input
              id="api"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:3000/api"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">JWT Token</Label>
            <textarea
              id="token"
              value={token}
              onChange={(e) => setTokenInput(e.target.value)}
              required
              rows={4}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="eyJhbGciOi..."
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-3 py-2">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full h-11 rounded-lg shadow-[var(--shadow-button)]">
            {loading ? "Đang kiểm tra..." : "Vào dashboard"}
          </Button>
        </form>
      </div>
    </div>
  );
}