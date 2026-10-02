"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Loader2 } from "lucide-react";

const DEMO_ACCOUNTS = [
  { label: "Use demo Customer", email: "customer@giftapp.demo", role: "CUSTOMER" },
  { label: "Use demo Store Owner", email: "store@giftapp.demo", role: "STORE_OWNER" },
  { label: "Use demo Admin", email: "admin@giftapp.demo", role: "ADMIN" },
];
const DEMO_PASSWORD = "Demo@1234";

const ROLE_HOME: Record<string, string> = {
  CUSTOMER: "/",
  STORE_OWNER: "/store/dashboard",
  ADMIN: "/admin/dashboard",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("session_expired");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e?: React.FormEvent, overrideEmail?: string, overridePassword?: string) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: overrideEmail ?? email,
          password: overridePassword ?? password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Invalid email or password.");
        setLoading(false);
        return;
      }
      router.push(ROLE_HOME[data.user.role] ?? "/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-blush/40 px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose text-white">
          <Gift className="h-6 w-6" />
        </div>
        <span className="text-2xl font-semibold text-ink">Giftly</span>
      </div>
      <p className="mb-6 text-center text-muted">Send a little love 💗</p>

      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        {sessionExpired && (
          <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Your session ended or you don&apos;t have access to that area. Please sign in again.
          </p>
        )}
        <form onSubmit={(e) => submit(e)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-ink/10" />
          <span className="text-xs text-muted">or try a demo account</span>
          <div className="h-px flex-1 bg-ink/10" />
        </div>

        <div className="space-y-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <Button
              key={acc.email}
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={() => {
                setEmail(acc.email);
                setPassword(DEMO_PASSWORD);
                submit(undefined, acc.email, DEMO_PASSWORD);
              }}
            >
              {acc.label}
            </Button>
          ))}
        </div>
      </div>

      <p className="mt-6 max-w-sm text-center text-xs text-muted">
        Demo application - no real payments or deliveries.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
