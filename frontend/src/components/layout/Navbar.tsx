"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn, formatCurrency } from "@/lib/utils";
import { useWallet } from "@/hooks/useWallet";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

const NAV_ITEMS = [
  { href: "/courts", label: "Đặt sân" },
  { href: "/bookings", label: "Lịch của tôi" },
  { href: "/team-split", label: "Chia đội" },
  { href: "/wallet", label: "Ví tiền" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const { wallet } = useWallet();

  async function handleLogout() {
    try { await api.post("/auth/logout"); } catch {}
    useAuthStore.getState().setUser(null);
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-6">
        <Link href="/courts" className="font-bold text-green-700 text-lg mr-2 flex-shrink-0">
          🏓 Pickleball Hub
        </Link>

        <div className="flex gap-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition",
                pathname.startsWith(item.href)
                  ? "bg-green-100 text-green-700"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {!isLoading && user ? (
            <>
              {wallet !== undefined && (
                <Link
                  href="/wallet"
                  className="text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition"
                >
                  {formatCurrency(wallet.balance)}
                </Link>
              )}
              <span className="text-sm text-gray-500 hidden md:block">{user.full_name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Đăng xuất
              </button>
            </>
          ) : !isLoading ? (
            <Link
              href="/login"
              className="text-sm font-semibold bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg transition"
            >
              Đăng nhập
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
