"use client";

import { Crosshair, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TestQuestion = {
  id: string;
  number: number;
  answerType: string;
  answerKey: string;
  weight: number;
  x: number;
  y: number;
  w: number;
  h: number;
  options: string;
};

export type TestTemplateInitialQuestion = Omit<TestQuestion, "id">;

export type TestTemplateInitial = {
  name: string;
  testType: string;
  paper?: string;
  confidenceThreshold?: number;
  questions: TestTemplateInitialQuestion[];
};

function newQuestion(number: number): TestQuestion {
  return {
    id: crypto.randomUUID(),
    number,
    answerType: "MULTIPLE_CHOICE",
    answerKey: "A",
    weight: 1,
    x: 10,
    y: 10 + number * 6,
    w: 80,
    h: 5,
    options: "A,B,C,D,E"
  };
}

export function TestTemplateBuilder({
  companyId,
  templateId,
  initial
}: {
  companyId: string;
  templateId?: string;
  initial?: TestTemplateInitial;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "Template Tes Baru");
  const [testType, setTestType] = useState(initial?.testType ?? "MIXED");
  const [paper, setPaper] = useState(initial?.paper ?? "A4");
  const [confidenceThreshold, setConfidenceThreshold] = useState(initial?.confidenceThreshold ?? 0.82);
  const [questions, setQuestions] = useState<TestQuestion[]>(
    initial?.questions?.length
      ? initial.questions.map((question) => ({ ...question, id: crypto.randomUUID() }))
      : [newQuestion(1), { ...newQuestion(2), answerType: "NUMBER", answerKey: "2026", options: "0,1,2,3,4,5,6,7,8,9" }]
  );
  const [saving, setSaving] = useState(false);

  function updateQuestion(id: string, patch: Partial<TestQuestion>) {
    setQuestions((current) => current.map((question) => (question.id === id ? { ...question, ...patch } : question)));
  }

  async function save() {
    setSaving(true);
    const response = await fetch(templateId ? `/api/tests/templates/${templateId}` : "/api/tests/templates", {
      method: templateId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        name,
        testType,
        layoutConfig: {
          paper,
          detector: "opencv-js",
          confidenceThreshold,
          regions: questions.map(({ id, number, x, y, w, h, options }) => ({
            id,
            number,
            x,
            y,
            w,
            h,
            options: options.split(",").map((option) => option.trim()).filter(Boolean)
          }))
        },
        questions: questions.map((question) => ({
          number: question.number,
          answerType: question.answerType,
          answerKey: question.answerKey,
          weight: Number(question.weight)
        }))
      })
    });
    setSaving(false);
    if (response.ok) router.refresh();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-700">
              <Crosshair className="h-4 w-4" />
              Test Sheet Builder
            </div>
            <Input className="mt-3 h-11 max-w-xl text-lg font-semibold" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <Button type="button" onClick={save} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Menyimpan..." : templateId ? "Update Template" : "Simpan Template"}
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm font-medium">
            Jenis Tes
            <select value={testType} onChange={(event) => setTestType(event.target.value)} className="mt-1 h-9 w-full rounded-md border bg-white px-3 text-sm">
              <option value="MULTIPLE_CHOICE">Multiple choice</option>
              <option value="TRUE_FALSE">Benar/Salah</option>
              <option value="NUMBER_GRID">Number grid</option>
              <option value="MIXED">Mixed</option>
              <option value="ESSAY_SHORT">Essay pendek</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Paper
            <select value={paper} onChange={(event) => setPaper(event.target.value)} className="mt-1 h-9 w-full rounded-md border bg-white px-3 text-sm">
              <option value="A4">A4</option>
              <option value="F4">F4</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Confidence Minimum
            <Input type="number" step="0.01" min="0" max="1" className="mt-1" value={confidenceThreshold} onChange={(event) => setConfidenceThreshold(Number(event.target.value))} />
          </label>
        </div>

        <div className="mt-5 grid gap-3">
          {questions.map((question) => (
            <div key={question.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-cyan-200 hover:shadow-md">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-700">Soal / Area #{question.number}</div>
                <button type="button" onClick={() => setQuestions((current) => current.filter((item) => item.id !== question.id))} className="rounded-md p-2 text-rose-600 hover:bg-rose-50" aria-label="Hapus soal">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <label className="text-xs font-semibold uppercase text-slate-500">
                  No
                  <Input className="mt-1" type="number" value={question.number} onChange={(event) => updateQuestion(question.id, { number: Number(event.target.value) })} />
                </label>
                <label className="text-xs font-semibold uppercase text-slate-500">
                  Tipe
                  <select value={question.answerType} onChange={(event) => updateQuestion(question.id, { answerType: event.target.value })} className="mt-1 h-9 w-full rounded-md border bg-white px-3 text-sm font-normal text-slate-900">
                    <option value="MULTIPLE_CHOICE">Pilihan</option>
                    <option value="TRUE_FALSE">Benar/Salah</option>
                    <option value="NUMBER">Angka</option>
                    <option value="ESSAY_SHORT">Essay pendek</option>
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase text-slate-500">
                  Answer Key
                  <Input className="mt-1" value={question.answerKey} onChange={(event) => updateQuestion(question.id, { answerKey: event.target.value })} />
                </label>
                <label className="text-xs font-semibold uppercase text-slate-500">
                  Bobot
                  <Input className="mt-1" type="number" min="0" step="0.1" value={question.weight} onChange={(event) => updateQuestion(question.id, { weight: Number(event.target.value) })} />
                </label>
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_220px]">
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Area X/Y/W/H</div>
                  <div className="grid grid-cols-4 gap-2">
                    {(["x", "y", "w", "h"] as const).map((key) => (
                      <label key={key} className="text-xs text-slate-500">
                        {key.toUpperCase()}
                        <Input className="mt-1" type="number" value={question[key]} onChange={(event) => updateQuestion(question.id, { [key]: Number(event.target.value) })} />
                      </label>
                    ))}
                  </div>
                </div>
                <label className="text-xs font-semibold uppercase text-slate-500">
                  Opsi / Grid
                  <Input className="mt-1" value={question.options} onChange={(event) => updateQuestion(question.id, { options: event.target.value })} />
                </label>
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="secondary" className="mt-4" onClick={() => setQuestions((current) => [...current, newQuestion(current.length + 1)])}>
          <Plus className="h-4 w-4" />
          Tambah Soal / Area Deteksi
        </Button>
      </section>

      <aside className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-4 font-semibold">Preview Layout Kertas</div>
        <div className="relative mx-auto aspect-[3/4] max-w-sm rounded-lg border bg-[linear-gradient(#f8fafc_1px,transparent_1px),linear-gradient(90deg,#f8fafc_1px,transparent_1px)] bg-[size:18px_18px] shadow-inner">
          {questions.map((question) => (
            <div
              key={question.id}
              className="absolute rounded border border-cyan-500 bg-cyan-100/70 px-1 text-[10px] font-semibold text-cyan-900"
              style={{ left: `${question.x}%`, top: `${question.y}%`, width: `${question.w}%`, height: `${question.h}%` }}
            >
              {question.number}. {question.answerType}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
