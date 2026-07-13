"use client";

import { Bell, CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { requestPythonApi } from "@/lib/api";
import type { Job } from "@/types/types";

const LAST_SEEN_KEY = "brixta.notifications.last-seen";

export default function NotificationCenter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [lastSeen, setLastSeen] = useState(() =>
    typeof window === "undefined" ? 0 : Number(window.localStorage.getItem(LAST_SEEN_KEY) || 0),
  );

  useEffect(() => {
    const load = async () => {
      try {
        const value = await requestPythonApi<{ jobs: Job[] }>("/prod/jobs?limit=20");
        setJobs(value.jobs || []);
      } catch {
        // The rest of the dashboard remains usable if Core is offline.
      }
    };
    const initial = window.setTimeout(load, 0);
    const timer = window.setInterval(load, 10_000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, []);

  const events = useMemo(
    () => jobs.filter((job) => job.status !== "queued").slice(0, 8),
    [jobs],
  );
  const unread = events.filter(
    (job) => new Date(job.updated_at || 0).getTime() > lastSeen,
  ).length;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      const now = Date.now();
      setLastSeen(now);
      window.localStorage.setItem(LAST_SEEN_KEY, String(now));
    }
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" aria-label="Notifications" onClick={toggle}>
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {Math.min(unread, 9)}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border bg-popover shadow-2xl">
          <div className="border-b px-4 py-3">
            <p className="font-semibold">Pipeline activity</p>
            <p className="text-xs text-muted-foreground">Updates automatically every 10 seconds.</p>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {events.map((job) => {
              const Icon = job.status === "completed" ? CheckCircle2 : job.status === "failed" ? CircleAlert : LoaderCircle;
              return (
                <button
                  key={job.id}
                  className="flex w-full gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted"
                  onClick={() => { setOpen(false); router.push("/celery"); }}
                >
                  <Icon className={job.status === "failed" ? "mt-0.5 text-destructive" : "mt-0.5 text-muted-foreground"} size={17} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{job.source_target}</span>
                    <span className="block text-xs capitalize text-muted-foreground">{job.status} · {job.current_stage || "pipeline"}</span>
                  </span>
                </button>
              );
            })}
            {events.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No pipeline activity yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
