"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      className={`block rounded-md px-3 py-2 text-sm ${
        active ? "bg-gray-900 font-medium" : "hover:bg-gray-700"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Sidebar() {
  const router = useRouter();
  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      router.replace("/login");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-800 text-white">
      <div className="px-4 py-4 border-b">
        <Link href="/dashboard" className="text-lg font-semibold hover:underline">
          Howdy
        </Link>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        <NavItem href="/dashboard" label="Dashboard" />
        <NavItem href="/settings" label="Settings" />
      </nav>
      <div className="mt-auto px-4 py-4 border-t space-y-2">
        <button
          onClick={handleLogout}
          className="w-full inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          Logout
        </button>
        <div className="text-xs text-gray-500">Howdy v0.1.0</div>
      </div>
    </div>
  );
}


