"use client";

import { usePathname } from "next/navigation";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAuthRoute = pathname === "/login" || pathname === "/signin" || pathname === "/signup";
  
  return <main className={`flex-1 ${!isHome && !isAuthRoute ? 'pt-20' : ''}`}>{children}</main>;
}
