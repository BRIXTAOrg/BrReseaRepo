"use client";

import { Bell, Moon, Search, UserCircle2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-8">

      <div className="relative w-96">

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

        <Button
          variant="ghost"
          size="icon"
        >
          <Bell size={18} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
        >
          <Moon size={18} />
        </Button>

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