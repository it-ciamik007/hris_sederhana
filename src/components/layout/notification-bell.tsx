"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

function timeAgo(value: string) {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

export function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/my/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { items: NotificationItem[]; unreadCount: number };
      setItems(data.items);
      setUnread(data.unreadCount);
    } catch {
      // abaikan kegagalan polling; dicoba lagi interval berikutnya
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const markRead = async (payload: { id?: string; all?: boolean }) => {
    await fetch("/api/my/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    refresh();
  };

  const handleItemClick = async (item: NotificationItem) => {
    setOpen(false);
    if (!item.readAt) await markRead({ id: item.id });
    if (item.link) router.push(item.link);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-input bg-background/50 text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="Notifikasi"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[80]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-[81] w-[min(92vw,360px)] overflow-hidden rounded-xl border border-border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold">Notifikasi</span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markRead({ all: true })}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Tandai semua dibaca
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={`block w-full border-b border-border/60 px-4 py-3 text-left transition hover:bg-accent ${item.readAt ? "opacity-70" : "bg-primary/5"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{item.title}</span>
                    {!item.readAt && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
                  <div className="mt-1 text-[11px] text-muted-foreground/70">{timeAgo(item.createdAt)}</div>
                </button>
              ))}
              {!items.length && (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">Belum ada notifikasi.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
