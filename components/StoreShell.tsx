"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ClipboardList, Store as StoreIcon, LogOut, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/store/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/store/products", label: "Products", icon: Package },
  { href: "/store/orders", label: "Orders", icon: ClipboardList },
  { href: "/store/profile", label: "Profile", icon: StoreIcon },
];

export function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-blush/20 pb-16 lg:flex lg:pb-0">
      <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-ink/5 bg-white p-4 lg:flex">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose text-white">
            <Gift className="h-4 w-4" />
          </div>
          <span className="font-serif font-semibold text-ink">Giftly · Store</span>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium",
                  active ? "bg-rose text-white" : "text-ink hover:bg-blush/60"
                )}
              >
                <Icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={logout} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-blush/60">
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </aside>

      <div className="flex-1">
        <div className="flex items-center justify-between border-b border-ink/5 bg-white px-4 py-3 lg:hidden">
          <span className="font-serif font-semibold text-ink">Giftly · Store</span>
          <button onClick={logout} className="text-sm text-muted">
            Log out
          </button>
        </div>
        <main className="p-4">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-ink/5 bg-white lg:hidden">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("flex flex-1 flex-col items-center gap-1 py-2.5 text-xs", active ? "text-rose" : "text-muted")}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
