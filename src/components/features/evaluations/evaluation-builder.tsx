"use client";

import { Copy, Eye, Plus, Settings2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Question = {
  id: string;
  label: string;
  answerType: string;
  placeholder: string;
  width: "FULL" | "HALF" | "THIRD";
  required: boolean;
  weight: number;
  optionsText: string;
};

type Section = {
  id: string;
  title: string;
  description: string;
  columns: 1 | 2 | 3;
  questions: Question[];
};

export type EvaluationBuilderInitialSection = {
  title: string;
  description?: string;
  columns?: 1 | 2 | 3;
  questions: Array<{
    label: string;
    answerType: string;
    placeholder?: string;
    width?: "FULL" | "HALF" | "THIRD";
    required?: boolean;
    weight?: number;
    options?: string[];
  }>;
};

function newQuestion(): Question {
  return {
    id: crypto.randomUUID(),
    label: "Pertanyaan baru",
    answerType: "RATING_1_5",
    placeholder: "",
    width: "FULL",
    required: true,
    weight: 1,
    optionsText: "Sangat kurang\nKurang\nCukup\nBaik\nSangat baik"
  };
}

function newSection(): Section {
  return {
    id: crypto.randomUUID(),
    title: "Section Penilaian",
    description: "Kelompok kompetensi atau aspek penilaian.",
    columns: 2,
    questions: [newQuestion()]
  };
}

function toSections(initialSections?: EvaluationBuilderInitialSection[]) {
  if (!initialSections?.length) return [newSection()];
  return initialSections.map((section) => ({
    id: crypto.randomUUID(),
    title: section.title,
    description: section.description ?? "",
    columns: section.columns ?? 2,
    questions: section.questions.map((question) => ({
      id: crypto.randomUUID(),
      label: question.label,
      answerType: question.answerType,
      placeholder: question.placeholder ?? "",
      width: question.width ?? "FULL",
      required: question.required ?? true,
      weight: question.weight ?? 1,
      optionsText: (question.options?.length ? question.options : ["Sangat kurang", "Kurang", "Cukup", "Baik", "Sangat baik"]).join("\n")
    }))
  }));
}

export function EvaluationBuilder({
  companyId,
  formId,
  initialTitle,
  initialIsAnonymous,
  initialSections
}: {
  companyId: string;
  formId?: string;
  initialTitle?: string;
  initialIsAnonymous?: boolean;
  initialSections?: EvaluationBuilderInitialSection[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle ?? "Form Penilaian Karyawan");
  const [isAnonymous, setIsAnonymous] = useState(initialIsAnonymous ?? false);
  const [sections, setSections] = useState<Section[]>(() => toSections(initialSections));
  const [saving, setSaving] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState(() => sections[0]?.questions[0]?.id ?? "");

  const activeQuestion = useMemo(
    () => sections.flatMap((section) => section.questions).find((question) => question.id === activeQuestionId),
    [activeQuestionId, sections]
  );

  function updateSection(sectionId: string, patch: Partial<Section>) {
    setSections((current) => current.map((section) => (section.id === sectionId ? { ...section, ...patch } : section)));
  }

  function updateQuestion(questionId: string, patch: Partial<Question>) {
    setSections((current) =>
      current.map((section) => ({
        ...section,
        questions: section.questions.map((question) => (question.id === questionId ? { ...question, ...patch } : question))
      }))
    );
  }

  async function save() {
    setSaving(true);
    const response = await fetch(formId ? `/api/evaluations/forms/${formId}` : "/api/evaluations/forms", {
      method: formId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        title,
        isAnonymous,
        sections: sections.map((section) => ({
          title: section.title,
          description: section.description,
          columns: section.columns,
          questions: section.questions.map((question) => ({
            question: question.label,
            answerType: question.answerType,
            weight: Number(question.weight),
            optionsJson: {
              placeholder: question.placeholder,
              width: question.width,
              required: question.required,
              options: question.optionsText.split("\n").map((option) => option.trim()).filter(Boolean)
            }
          }))
        }))
      })
    });
    setSaving(false);
    if (response.ok) router.refresh();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b bg-[linear-gradient(135deg,#f8fafc,#ffffff_48%,#ecfeff)] p-5">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-700">
                <Settings2 className="h-4 w-4" />
                Dynamic Form Builder
              </div>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-3 h-11 max-w-xl text-lg font-semibold" />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} />
                Anonymous
              </label>
              <Button type="button" onClick={save} disabled={saving}>
                {saving ? "Menyimpan..." : formId ? "Update Form" : "Simpan Form"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5">
          {sections.map((section) => (
            <div key={section.id} className="rounded-lg border bg-slate-50/60 p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
                <Input value={section.title} onChange={(event) => updateSection(section.id, { title: event.target.value })} className="font-semibold" />
                <select
                  value={section.columns}
                  onChange={(event) => updateSection(section.id, { columns: Number(event.target.value) as 1 | 2 | 3 })}
                  className="h-9 rounded-md border bg-white px-3 text-sm"
                >
                  <option value={1}>1 kolom</option>
                  <option value={2}>2 kolom</option>
                  <option value={3}>3 kolom</option>
                </select>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => updateSection(section.id, { questions: [...section.questions, newQuestion()] })}
                >
                  <Plus className="h-4 w-4" />
                  Field
                </Button>
              </div>
              <Textarea
                value={section.description}
                onChange={(event) => updateSection(section.id, { description: event.target.value })}
                className="mt-3 min-h-16"
              />
              <div className={`mt-4 grid gap-3 ${section.columns === 1 ? "md:grid-cols-1" : section.columns === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
                {section.questions.map((question) => (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => setActiveQuestionId(question.id)}
                    className={`rounded-lg border bg-white p-3 text-left shadow-sm transition hover:border-cyan-300 hover:shadow-md ${
                      activeQuestionId === question.id ? "border-cyan-500 ring-2 ring-cyan-100" : ""
                    } ${question.width === "FULL" ? "md:col-span-full" : question.width === "HALF" && section.columns === 3 ? "md:col-span-2" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{question.label}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{question.answerType} - bobot {question.weight}</div>
                      </div>
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <PreviewInput question={question} />
                  </button>
                ))}
              </div>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => setSections((current) => [...current, newSection()])}>
            <Plus className="h-4 w-4" />
            Tambah Section
          </Button>
        </div>
      </section>

      <aside className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2 font-semibold">
          <Eye className="h-4 w-4 text-cyan-700" />
          Properti Field
        </div>
        {activeQuestion ? (
          <div className="grid gap-3">
            <label className="text-sm font-medium">
              Label / Tulisan
              <Input className="mt-1" value={activeQuestion.label} onChange={(event) => updateQuestion(activeQuestion.id, { label: event.target.value })} />
            </label>
            <label className="text-sm font-medium">
              Tipe Jawaban
              <select
                value={activeQuestion.answerType}
                onChange={(event) => updateQuestion(activeQuestion.id, { answerType: event.target.value })}
                className="mt-1 h-9 w-full rounded-md border bg-white px-3 text-sm"
              >
                <option value="RATING_1_5">Rating 1-5</option>
                <option value="RATING_1_10">Rating 1-10</option>
                <option value="TEXT">Text</option>
                <option value="TEXTAREA">Textarea</option>
                <option value="YES_NO">Ya/Tidak</option>
                <option value="MULTIPLE_CHOICE">Pilihan</option>
                <option value="CHECKBOX">Checkbox</option>
                <option value="NUMBER">Angka</option>
                <option value="MATRIX_RATING">Matrix rating</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Placeholder
              <Input className="mt-1" value={activeQuestion.placeholder} onChange={(event) => updateQuestion(activeQuestion.id, { placeholder: event.target.value })} />
            </label>
            <label className="text-sm font-medium">
              Lebar Field
              <select
                value={activeQuestion.width}
                onChange={(event) => updateQuestion(activeQuestion.id, { width: event.target.value as Question["width"] })}
                className="mt-1 h-9 w-full rounded-md border bg-white px-3 text-sm"
              >
                <option value="FULL">Full row</option>
                <option value="HALF">Half</option>
                <option value="THIRD">Third</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Bobot
              <Input type="number" min="0" step="0.1" className="mt-1" value={activeQuestion.weight} onChange={(event) => updateQuestion(activeQuestion.id, { weight: Number(event.target.value) })} />
            </label>
            <label className="text-sm font-medium">
              Opsi
              <Textarea className="mt-1" value={activeQuestion.optionsText} onChange={(event) => updateQuestion(activeQuestion.id, { optionsText: event.target.value })} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={activeQuestion.required} onChange={(event) => updateQuestion(activeQuestion.id, { required: event.target.checked })} />
              Wajib diisi
            </label>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                setSections((current) =>
                  current.map((section) => ({ ...section, questions: section.questions.filter((question) => question.id !== activeQuestion.id) }))
                );
              }}
            >
              <Trash2 className="h-4 w-4" />
              Hapus Field
            </Button>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Pilih field untuk mengatur properti.</div>
        )}
      </aside>
    </div>
  );
}

function PreviewInput({ question }: { question: Question }) {
  const options = question.optionsText
    .split("\n")
    .map((option) => option.trim())
    .filter(Boolean);

  if (question.answerType.includes("RATING")) {
    const max = question.answerType === "RATING_1_10" ? 10 : 5;
    return (
      <div className="mt-3 flex flex-wrap gap-1">
        {Array.from({ length: max }).map((_, index) => (
          <span key={index} className="grid h-7 w-7 place-items-center rounded border bg-white text-xs">
            {index + 1}
          </span>
        ))}
      </div>
    );
  }

  if (question.answerType === "TEXTAREA") {
    return <div className="mt-3 h-16 rounded border bg-slate-50 px-3 py-2 text-xs text-muted-foreground">{question.placeholder || "Textarea"}</div>;
  }

  if (question.answerType === "YES_NO") {
    return (
      <div className="mt-3 flex gap-2">
        {["Ya", "Tidak"].map((option) => (
          <span key={option} className="rounded-full border bg-slate-50 px-3 py-1 text-xs">{option}</span>
        ))}
      </div>
    );
  }

  if (question.answerType === "MULTIPLE_CHOICE") {
    return (
      <div className="mt-3 grid gap-1.5">
        {(options.length ? options : ["Pilihan A", "Pilihan B", "Pilihan C"]).slice(0, 4).map((option) => (
          <span key={option} className="flex items-center gap-2 text-xs text-slate-600">
            <span className="h-3 w-3 rounded-full border bg-white" />
            {option}
          </span>
        ))}
      </div>
    );
  }

  if (question.answerType === "CHECKBOX") {
    return (
      <div className="mt-3 grid gap-1.5">
        {(options.length ? options : ["Checklist A", "Checklist B", "Checklist C"]).slice(0, 4).map((option) => (
          <span key={option} className="flex items-center gap-2 text-xs text-slate-600">
            <span className="h-3 w-3 rounded border bg-white" />
            {option}
          </span>
        ))}
      </div>
    );
  }

  if (question.answerType === "NUMBER") {
    return <div className="mt-3 h-9 rounded border bg-slate-50 px-3 py-2 text-xs text-muted-foreground">0</div>;
  }

  if (question.answerType === "MATRIX_RATING") {
    return (
      <div className="mt-3 overflow-hidden rounded border text-xs">
        <div className="grid grid-cols-4 bg-slate-50">
          <span className="p-1">Aspek</span>
          {[1, 2, 3].map((item) => <span key={item} className="p-1 text-center">{item}</span>)}
        </div>
        {["Kualitas", "Kerja sama"].map((row) => (
          <div key={row} className="grid grid-cols-4 border-t">
            <span className="p-1">{row}</span>
            {[1, 2, 3].map((item) => <span key={item} className="p-1 text-center">( )</span>)}
          </div>
        ))}
      </div>
    );
  }

  return <div className="mt-3 h-9 rounded border bg-slate-50 px-3 py-2 text-xs text-muted-foreground">{question.placeholder || "Input"}</div>;
}
