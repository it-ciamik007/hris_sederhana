import { MessageCircle, QrCode, Send, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { WhatsAppTools } from "@/components/features/settings/whatsapp-tools";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { getWhatsAppSettings } from "@/server/services/settings.service";
import { getWhatsAppInstanceStatus } from "@/server/services/whatsapp.service";

export default async function WhatsAppSettingsPage() {
  const [settings, status, logs, queued, sent, failed] = await Promise.all([
    getWhatsAppSettings(),
    getWhatsAppInstanceStatus(),
    db.whatsAppMessageLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    db.notificationQueue.count({ where: { status: "QUEUED" } }),
    db.whatsAppMessageLog.count({ where: { status: "sent" } }),
    db.whatsAppMessageLog.count({ where: { status: "failed" } })
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<><MessageCircle className="h-4 w-4" />WAM Integration</>}
        title="WhatsApp Settings"
        description="Konfigurasi instance WAM, pairing device, fallback approver phone, dan monitor queue/log notifikasi."
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Instance" value={settings.instanceId || "-"} tone="cyan" />
        <MetricCard label="Queue" value={queued} tone="amber" />
        <MetricCard label="Sent" value={sent} tone="emerald" />
        <MetricCard label="Failed" value={failed} tone="rose" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 font-semibold">
            <Settings2 className="h-4 w-4 text-cyan-700" />
            Konfigurasi WAM
          </div>
          <form action="/api/settings/whatsapp" method="post" className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium md:col-span-2">
              Base URL
              <Input name="baseUrl" defaultValue={settings.baseUrl} required className="mt-1" />
            </label>
            <label className="text-sm font-medium md:col-span-2">
              API Key
              <Input name="apiKey" defaultValue={settings.apiKey} type="password" className="mt-1" />
            </label>
            <label className="text-sm font-medium">
              Instance ID
              <Input name="instanceId" defaultValue={settings.instanceId} placeholder="inst_xxx" className="mt-1" />
            </label>
            <label className="text-sm font-medium">
              Nomor Pairing
              <Input name="pairingPhone" defaultValue={settings.pairingPhone} placeholder="+628..." className="mt-1" />
            </label>
            <label className="text-sm font-medium md:col-span-2">
              Fallback Approval Phone
              <Input name="fallbackApprovalPhone" defaultValue={settings.fallbackApprovalPhone} placeholder="+628..." className="mt-1" />
              <span className="mt-1 block text-xs text-slate-500">
                Dipakai jika SPV/Manager/HRD belum punya nomor WhatsApp di profil karyawan.
              </span>
            </label>
            <div className="md:col-span-2">
              <Button type="submit">Simpan Konfigurasi</Button>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <QrCode className="h-4 w-4 text-cyan-700" />
              Instance Status
            </div>
            <pre className="max-h-60 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(status, null, 2)}</pre>
          </section>

          <WhatsAppTools pairingPhone={settings.pairingPhone} />

          <form action="/api/whatsapp/send-test" method="post" className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <Send className="h-4 w-4 text-cyan-700" />
              Kirim Test
            </div>
            <label className="mb-3 block text-sm font-medium">
              Nomor
              <Input name="phone" placeholder="+628..." defaultValue={settings.fallbackApprovalPhone} required className="mt-1" />
            </label>
            <label className="mb-4 block text-sm font-medium">
              Pesan
              <Input name="message" defaultValue="Test HRIS WhatsApp notification" required className="mt-1" />
            </label>
            <Button type="submit">Kirim Test</Button>
          </form>
        </aside>
      </div>

      <section className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4 font-semibold">Message Logs</div>
        <div className="overflow-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Direction</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t">
                  <td className="px-4 py-3">{log.createdAt.toISOString().slice(0, 19).replace("T", " ")}</td>
                  <td className="px-4 py-3">{log.phone}</td>
                  <td className="max-w-md truncate px-4 py-3 text-slate-500">{log.message}</td>
                  <td className="px-4 py-3">{log.direction}</td>
                  <td className="px-4 py-3"><StatusBadge status={log.status.toUpperCase()} /></td>
                </tr>
              ))}
              {!logs.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">Belum ada log pesan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
