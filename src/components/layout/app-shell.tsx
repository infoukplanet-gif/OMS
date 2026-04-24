"use client";

import { type ReactNode } from "react";
import { Sidebar, SidebarProvider, useSidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

function ShellContent({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out",
        collapsed ? "pl-[68px]" : "pl-56"
      )}
    >
      <Header />
      <main className="p-6">{children}</main>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar />
      <ShellContent>{children}</ShellContent>
    </SidebarProvider>
  );
}
