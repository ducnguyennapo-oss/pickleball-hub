import Link from "next/link";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/courts", label: "Quản lý sân" },
  { href: "/admin/members", label: "Thành viên" },
  { href: "/admin/bookings", label: "Đặt sân" },
  { href: "/admin/attendance", label: "Điểm danh" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <p className="font-bold text-green-700">🏓 Admin Panel</p>
        </div>
        <nav className="p-3 space-y-1">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
