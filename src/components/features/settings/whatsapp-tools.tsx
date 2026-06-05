"use client";

import { KeyRound, PlusCircle, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function WhatsAppTools({ pairingPhone }: { pairingPhone: string }) {
  const router = useRouter();
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState("");

  async function post(url: string, body?: FormData) {
    setLoading(url);
    const response = await fetch(url, { method: "POST", body });
    setResult(await response.json());
    setLoading("");
    if (response.ok) router.refresh();
  }

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 font-semibold">
        <QrCode className="h-4 w-4 text-cyan-700" />
        Pairing Tools
      </div>
      <div className="grid gap-3">
        <form
          className="grid gap-2 rounded-xl border bg-slate-50 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            post("/api/settings/whatsapp/create-instance", new FormData(event.currentTarget));
          }}
        >
          <Input name="name" defaultValue="HRIS WhatsApp" placeholder="Nama instance" />
          <Input name="webhookUrl" placeholder="https://domain-anda.com/api/whatsapp/webhook" />
          <Button type="submit" variant="secondary" disabled={!!loading}>
            <PlusCircle className="h-4 w-4" />
            Create Instance
          </Button>
        </form>
        <Button type="button" variant="secondary" disabled={!!loading} onClick={() => post("/api/settings/whatsapp/qr")}>
          <QrCode className="h-4 w-4" />
          Generate QR
        </Button>
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            post("/api/settings/whatsapp/pairing-code", new FormData(event.currentTarget));
          }}
        >
          <Input name="phoneNumber" defaultValue={pairingPhone} placeholder="+628..." />
          <Button type="submit" variant="secondary" disabled={!!loading}>
            <KeyRound className="h-4 w-4" />
            Generate Pairing Code
          </Button>
        </form>
        {result ? (
          <pre className="max-h-72 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-slate-500">Hasil QR atau pairing code akan tampil di sini.</p>
        )}
      </div>
    </section>
  );
}
