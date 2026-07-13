"use client";

import { Search, UserCircle2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import NotificationCenter from "./NotificationCenter";

export default function Navbar() {
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

        <Button
          variant="ghost"
          size="icon"
        >
          <UserCircle2 size={24} />
        </Button>

      </div>

    </header>
  );
}
