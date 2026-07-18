"use client";

import { LogOut, Search, UserCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import NotificationCenter from "./NotificationCenter";

export default function Navbar() {
  const [session, setSession] = useState<{
    authenticated: boolean;
    authMode: string;
    user: { name: string; email: string } | null;
  } | null>(null);

  useEffect(() => {
    fetch("/api/session", { cache: "no-store" })
      .then((response) => response.json())
      .then(setSession)
      .catch(() => setSession(null));
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background/85 px-4 backdrop-blur-xl md:px-8">

      <div className="relative hidden w-96 md:block">

        <Search
          size={18}
          className="absolute left-3 top-3 text-muted-foreground"
        />

        <Input
          placeholder="Search jobs, plugins, documents..."
          className="pl-10"
        />

      </div>

      <div className="flex items-center gap-2">

        <NotificationCenter />

        <ThemeToggle />

        <div className="hidden text-right text-xs sm:block">
          <p className="max-w-48 truncate font-medium">{session?.user?.name || "BRIXTA"}</p>
          <p className="max-w-48 truncate text-muted-foreground">{session?.user?.email || session?.authMode || ""}</p>
        </div>

        {session?.authMode === "auth0" ? (
          <Button variant="ghost" size="icon" render={<Link href="/auth/logout" />} title="Sign out">
            <LogOut size={20} />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" title="Local profile">
            <UserCircle2 size={24} />
          </Button>
        )}

      </div>

    </header>
  );
}
