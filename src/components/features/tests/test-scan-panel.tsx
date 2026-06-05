"use client";

import { FileSpreadsheet, UploadCloud } from "lucide-react";
import { useState } from "react";
import { OCRReviewPanel } from "@/components/features/tests/ocr-review-panel";
import { Button } from "@/components/ui/button";

type TemplateOption = {
  id: string;
  name: string;
};

type ScanResult = {
  status: string;
  engine: string;
  template: { name: string; questionCount: number };
  participants: Array<{
    name: string;
    score: number;
    maxScore: number;
    finalScore: number;
    items: Array<{ id: string; question: string; expected: string; detected: string; confidence: number; correct: boolean }>;
  }>;
};

export function TestScanPanel({ templates }: { templates: TemplateOption[] }) {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    const response = await fetch("/api/tests/scan", {
      method: "POST",
      body: new FormData(event.currentTarget)
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.message ?? "Scan gagal diproses.");
      return;
    }
    setResult(data);
  }

  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-cyan-700">
            <FileSpreadsheet className="h-4 w-4" />
            Scan OCR / Excel Checker
          </div>
          <h2 className="mt-2 text-xl font-semibold">Upload hasil scan atau tabel Excel</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Pilih template, upload file `.xlsx`, `.xls`, atau `.csv`, lalu sistem membandingkan jawaban dengan answer key.
          </p>
        </div>
        <form onSubmit={submit} className="grid w-full gap-2 md:max-w-xl md:grid-cols-[1fr_1fr_auto]">
          <select name="templateId" required className="h-10 rounded-lg border bg-slate-50 px-3 text-sm">
            <option value="">Pilih template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <input name="file" type="file" accept=".xlsx,.xls,.csv" required className="h-10 rounded-lg border bg-slate-50 px-3 py-2 text-sm" />
          <Button type="submit" disabled={loading}>
            <UploadCloud className="h-4 w-4" />
            {loading ? "Memproses..." : "Scan"}
          </Button>
        </form>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {result && (
        <div className="mt-5 grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase text-slate-500">Engine</div>
              <div className="mt-1 font-semibold">{result.engine}</div>
            </div>
            <div className="rounded-lg border bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase text-slate-500">Template</div>
              <div className="mt-1 font-semibold">{result.template.name}</div>
            </div>
            <div className="rounded-lg border bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase text-slate-500">Peserta</div>
              <div className="mt-1 font-semibold">{result.participants.length}</div>
            </div>
          </div>

          {result.participants.map((participant) => (
            <div key={participant.name} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-col justify-between gap-2 md:flex-row md:items-center">
                <div>
                  <div className="font-semibold">{participant.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Skor {participant.score}/{participant.maxScore} - {participant.finalScore}
                  </div>
                </div>
              </div>
              <OCRReviewPanel
                items={participant.items.map((item) => ({
                  id: item.id,
                  question: `${item.question} (${item.expected || "-"})`,
                  detected: item.detected || "-",
                  confidence: item.confidence
                }))}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
