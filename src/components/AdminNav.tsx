"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

const navItems = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/sessions", label: "Sesi" },
  { href: "/admin/approvals", label: "Approval" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    toast.success("Berhasil logout");
    router.push("/admin/login");
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <span className="font-bold text-blue-600 text-sm">Admin Panel</span>
          <div className="flex gap-1">
            {navItems.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
