"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "대시보드" },
  { href: "/patients", label: "환자 관리" },
  { href: "/messages", label: "메시지 관리" },
  { href: "/statistics", label: "통계" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white p-4 md:block">
      <div className="rounded-lg bg-teal-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
          Cozy VET
        </p>
        <p className="mt-1 text-sm font-medium text-slate-800">
          업무 자동화 시스템
        </p>
      </div>
      <nav className="mt-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-teal-600 text-white"
                  : "text-slate-700 hover:bg-slate-100",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
