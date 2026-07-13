"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface DashboardShellProps {
  children: ReactNode;
}

export default function DashboardShell({
  children,
}: DashboardShellProps) {
  return (
    <div className="flex h-screen bg-muted/25">

      <Sidebar />

      <main className="flex flex-1 flex-col overflow-hidden">

        <Navbar />

        <div className="flex-1 overflow-auto">
          {children}
        </div>

      </main>

    </div>
  );
}
