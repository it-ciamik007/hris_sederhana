"use client";

import { AlertTriangle, ArrowUpDown, BookOpen, Camera, CheckCircle2, FileImage, Loader2, RefreshCw, ScanText, Sigma, StopCircle, UploadCloud, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { analyzeNumberSequences, type SequenceIssue } from "@/lib/sequence-analyzer";
import { checkNumberTestAnswers, type AnswerDirection, type NumberTestWorkbook } from "@/lib/number-test-key";

const sampleText = `2 4 6 8 10
20 17 14 11 8
5 10 15 19 25`;

function cellKey(row: number, col: number) {
  return `${row}-${col}`;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.?0+$/, "");
}

function issueTitle(issue: SequenceIssue) {
  return issue.axis === "row" ? `Baris ${issue.lineNumber}` : `Kolom ${issue.lineNumber}`;
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("File gambar tidak bisa dibaca."));
    reader.readAsDataURL(file);
  });
}

export function NumberSequenceScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const keyFileRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [keyError, setKeyError] = useState("");
  const [progress, setProgress] = useState(0);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [busyLabel, setBusyLabel] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [liveScan, setLiveScan] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);
  const [workbook, setWorkbook] = useState<NumberTestWorkbook | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [answerDirection, setAnswerDirection] = useState<AnswerDirection>("auto");
  const [ignoreSingleDigit, setIgnoreSingleDigit] = useState(true);

  const analysis = useMemo(() => analyzeNumberSequences(text), [text]);
  const numberCount = useMemo(() => analysis.rows.reduce((total, row) => total + row.length, 0), [analysis.rows]);
  const maxCols = useMemo(() => Math.max(0, ...analysis.rows.map((row) => row.length)), [analysis.rows]);
  const issueMap = useMemo(() => {
    const map = new Map<string, SequenceIssue[]>();
    for (const issue of analysis.issues) {
      const key = cellKey(issue.row, issue.col);
      map.set(key, [...(map.get(key) ?? []), issue]);
    }
    return map;
  }, [analysis.issues]);
  const issueCellCount = issueMap.size;
  const selectedBlock = useMemo(
    () => workbook?.blocks.find((block) => block.id === selectedBlockId) ?? workbook?.blocks[0] ?? null,
    [selectedBlockId, workbook]
  );
  const keyCheck = useMemo(
    () =>
      selectedBlock
        ? checkNumberTestAnswers({
            text,
            keyValues: selectedBlock.keyValues,
            topDownKeyValues: selectedBlock.topDownKeyValues,
            bottomUpKeyValues: selectedBlock.bottomUpKeyValues,
            direction: answerDirection,
            ignoreSingleDigit
          })
        : null,
    [answerDirection, ignoreSingleDigit, selectedBlock, text]
  );
  const keyIssues = useMemo(() => keyCheck?.items.filter((item) => !item.correct).slice(0, 12) ?? [], [keyCheck]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    void video.play().catch(() => {
      setError("Preview kamera belum bisa diputar. Coba tutup lalu buka kamera lagi, atau gunakan upload foto.");
    });

    return () => {
      if (video.srcObject === stream) video.srcObject = null;
    };
  }, [stream]);

  async function startCamera() {
    setError("");
    setCameraReady(false);
    if (!window.isSecureContext) {
      setError("Kamera ponsel hanya bisa dibuka dari HTTPS atau localhost. Jika membuka dari IP lokal HTTP, gunakan deploy HTTPS atau upload foto.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Browser tidak membuka akses kamera. Pakai tombol upload foto dari ponsel.");
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } }
      });
      setStream(mediaStream);
    } catch {
      setError("Kamera tidak bisa dibuka. Pastikan izin kamera aktif atau gunakan upload foto.");
    }
  }

  function stopCamera() {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setCameraReady(false);
    setLiveScan(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  const recognizeImage = useCallback(async (image: string) => {
    setError("");
    setBusyLabel("Membaca OCR");
    setProgress(0);
    setConfidence(null);

    try {
      const { recognize } = await import("tesseract.js");
      const result = await recognize(image, "eng", {
        logger: (message) => {
          if (message.status === "recognizing text") {
            setProgress(Math.round(message.progress * 100));
          }
        }
      });
      setText(result.data.text);
      setConfidence(Math.round(result.data.confidence));
      setProgress(100);
    } catch {
      setError("OCR gagal membaca gambar. Coba foto lebih terang/lurus, atau paste angka manual di panel teks.");
    } finally {
      setBusyLabel("");
    }
  }, []);

  const captureFrame = useCallback(async (options?: { keepLivePreview?: boolean }) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setError("Preview kamera belum siap.");
      return;
    }

    const width = Math.min(1800, video.videoWidth * 1.5);
    const height = Math.round((width / video.videoWidth) * video.videoHeight);
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    context.filter = "contrast(1.15) saturate(0)";
    context.drawImage(video, 0, 0, width, height);
    const image = canvas.toDataURL("image/png");
    if (!options?.keepLivePreview) setImagePreview(image);
    await recognizeImage(image);
  }, [recognizeImage]);

  useEffect(() => {
    if (!stream || !cameraReady || !liveScan || busyLabel) return;
    const timer = window.setTimeout(() => {
      void captureFrame({ keepLivePreview: true });
    }, text ? 4500 : 1200);
    return () => window.clearTimeout(timer);
  }, [busyLabel, cameraReady, captureFrame, liveScan, stream, text]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const image = await readFileAsDataUrl(file);
    setImagePreview(image);
    await recognizeImage(image);
  }

  async function loadKeyFromResponse(response: Response) {
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message ?? "Workbook kunci tidak bisa dibaca.");
    const nextWorkbook = payload.data as NumberTestWorkbook;
    setWorkbook(nextWorkbook);
    setSelectedBlockId(nextWorkbook.blocks[0]?.id ?? "");
    setKeyError("");
  }

  async function loadDefaultWorkbook() {
    setKeyLoading(true);
    setKeyError("");
    try {
      await loadKeyFromResponse(await fetch("/api/tests/number-key"));
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : "Workbook default tidak bisa dimuat.");
    } finally {
      setKeyLoading(false);
    }
  }

  async function uploadWorkbook(file: File | undefined) {
    if (!file) return;
    setKeyLoading(true);
    setKeyError("");
    const form = new FormData();
    form.set("file", file);
    try {
      await loadKeyFromResponse(await fetch("/api/tests/number-key", { method: "POST", body: form }));
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : "Workbook upload tidak bisa dibaca.");
    } finally {
      setKeyLoading(false);
    }
  }

  function reset() {
    setImagePreview("");
    setText("");
    setError("");
    setProgress(0);
    setConfidence(null);
    setLiveScan(false);
    stopCamera();
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] xl:gap-5">
      <section className="min-w-0 rounded-lg border bg-card shadow-sm">
        <div className="border-b p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                <ScanText className="h-4 w-4" />
                Scan OCR Deret Angka
              </div>
              <h2 className="mt-2 text-xl font-semibold">Kamera, OCR, cek pola</h2>
            </div>
            <div className="inline-flex rounded-full border bg-background p-1 text-xs font-semibold">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">Tanpa kunci jawaban</span>
              <span className="px-3 py-1 text-muted-foreground">Naik / turun</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="overflow-hidden rounded-lg border bg-slate-950">
            {stream ? (
              <div className="relative aspect-[4/3] bg-slate-950">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onCanPlay={() => setCameraReady(true)}
                  onLoadedMetadata={(event) => void event.currentTarget.play()}
                  className={cn("h-full w-full object-cover transition-opacity duration-300", cameraReady ? "opacity-100" : "opacity-0")}
                />
                {!cameraReady && (
                  <div className="absolute inset-0 grid place-items-center p-6 text-center text-white">
                    <div>
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-200" />
                      <div className="mt-3 text-sm font-semibold">Menghubungkan kamera...</div>
                      <div className="mt-1 text-xs text-white/60">Izinkan akses kamera jika browser meminta konfirmasi.</div>
                    </div>
                  </div>
                )}
              </div>
            ) : imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="Preview scan" className="aspect-[4/3] w-full object-contain bg-slate-950" />
            ) : (
              <div className="grid aspect-[4/3] place-items-center bg-[linear-gradient(135deg,#0f172a,#155e75_48%,#312e81)] p-8 text-center text-white">
                <div>
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-white/10">
                    <Camera className="h-7 w-7" />
                  </div>
                  <div className="mt-4 text-lg font-semibold">Siap scan dari ponsel</div>
                  <div className="mt-1 text-sm text-white/70">Gunakan kamera atau upload foto tabel angka.</div>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          <input
            ref={keyFileRef}
            type="file"
            accept=".xlsx,.xlsm,.xls"
            className="hidden"
            onChange={(event) => void uploadWorkbook(event.target.files?.[0])}
          />

          <div className="grid gap-2 sm:grid-cols-2">
            {!stream ? (
              <Button type="button" onClick={() => void startCamera()} className="rounded-lg">
                <Camera className="h-4 w-4" />
                Buka Kamera
              </Button>
            ) : (
              <Button type="button" onClick={stopCamera} variant="secondary" className="rounded-lg">
                <StopCircle className="h-4 w-4" />
                Tutup Kamera
              </Button>
            )}
            <Button type="button" onClick={() => fileRef.current?.click()} variant="secondary" className="rounded-lg">
              <FileImage className="h-4 w-4" />
              Upload Foto
            </Button>
            <Button
              type="button"
              onClick={() => setLiveScan((value) => !value)}
              disabled={!stream || !cameraReady || Boolean(busyLabel)}
              variant={liveScan ? "secondary" : "primary"}
              className="rounded-lg"
            >
              <Video className="h-4 w-4" />
              {liveScan ? "Stop Live Scan" : "Live Scan"}
            </Button>
            <Button type="button" onClick={() => void captureFrame()} disabled={!stream || Boolean(busyLabel)} className="rounded-lg">
              {busyLabel ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              Ambil & OCR
            </Button>
            <Button type="button" onClick={reset} variant="ghost" className="rounded-lg">
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {(busyLabel || progress > 0 || confidence !== null) && (
            <div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>{busyLabel || "OCR selesai"}</span>
                <span>{confidence !== null ? `Confidence ${confidence}%` : `${progress}%`}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${Math.max(progress, confidence !== null ? 100 : 0)}%` }} />
              </div>
            </div>
          )}

          {error && (
            <div className="flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-900">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                  <BookOpen className="h-4 w-4" />
                  Template Excel Soal + Kunci
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sistem membaca angka merah dari sheet Asli sebagai kunci jawaban.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void loadDefaultWorkbook()} disabled={keyLoading} variant="secondary" className="h-9 rounded-lg px-3">
                  {keyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                  Muat Default
                </Button>
                <Button type="button" onClick={() => keyFileRef.current?.click()} disabled={keyLoading} variant="secondary" className="h-9 rounded-lg px-3">
                  <UploadCloud className="h-4 w-4" />
                  Upload Excel
                </Button>
              </div>
            </div>

            {keyError && (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                {keyError}
              </div>
            )}

            {workbook && (
              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_170px]">
                <div>
                  <label htmlFor="key-block" className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Sheet / kolom kunci
                  </label>
                  <select
                    id="key-block"
                    value={selectedBlock?.id ?? ""}
                    onChange={(event) => setSelectedBlockId(event.target.value)}
                    className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:focus:ring-cyan-500/20"
                  >
                    {workbook.blocks.map((block) => (
                      <option key={block.id} value={block.id}>
                        {block.label} ({block.answerCount})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="answer-direction" className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Arah jawab
                  </label>
                  <select
                    id="answer-direction"
                    value={answerDirection}
                    onChange={(event) => setAnswerDirection(event.target.value as AnswerDirection)}
                    className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:focus:ring-cyan-500/20"
                  >
                    <option value="auto">Auto: atas dulu</option>
                    <option value="top-down">Atas ke bawah</option>
                    <option value="bottom-up">Bawah ke atas</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground lg:col-span-2">
                  <input
                    type="checkbox"
                    checked={ignoreSingleDigit}
                    onChange={(event) => setIgnoreSingleDigit(event.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  Abaikan angka 1 digit dari OCR agar angka soal tidak ikut dinilai.
                </label>
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="ocr-text" className="text-sm font-semibold">
                Teks OCR / angka manual
              </label>
              <button type="button" onClick={() => setText(sampleText)} className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 dark:text-cyan-300">
                Muat contoh
              </button>
            </div>
            <textarea
              id="ocr-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={7}
              placeholder="Contoh: 2 4 6 8 10"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:focus:ring-cyan-500/20"
            />
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </section>

      <section className="min-w-0 rounded-lg border bg-card shadow-sm">
        <div className="border-b p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                <Sigma className="h-4 w-4" />
                Hasil Analisis
              </div>
              <h2 className="mt-2 text-xl font-semibold">Titik salah pada deret</h2>
            </div>
            <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold", issueCellCount ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200")}>
              {issueCellCount ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {numberCount ? `${issueCellCount} titik perlu cek` : "Belum ada angka"}
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-900">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Angka</div>
              <div className="mt-1 text-2xl font-semibold">{numberCount}</div>
            </div>
            <div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-900">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Pola</div>
              <div className="mt-1 text-2xl font-semibold">{analysis.summaries.length}</div>
            </div>
            <div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-900">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Salah</div>
              <div className={cn("mt-1 text-2xl font-semibold", issueCellCount ? "text-amber-700 dark:text-amber-200" : "text-emerald-700 dark:text-emerald-200")}>{issueCellCount}</div>
            </div>
          </div>

          {selectedBlock && keyCheck && (
            <div className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-900">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                    <ArrowUpDown className="h-4 w-4" />
                    Koreksi dengan kunci merah Excel
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {selectedBlock.label}, arah terpakai: {keyCheck.direction === "top-down" ? "atas ke bawah" : "bawah ke atas"}.
                    Auto hanya pindah ke bawah-ke-atas jika hasil atas-ke-bawah nol benar.
                    {keyCheck.offset > 0 ? ` ${keyCheck.offset} angka awal diabaikan karena terdeteksi sebagai nomor/header.` : ""}
                  </div>
                </div>
                <div className="rounded-lg bg-background px-4 py-3 text-right">
                  <div className={cn("text-2xl font-semibold", keyCheck.scorePercent >= 80 ? "text-emerald-700 dark:text-emerald-200" : "text-amber-700 dark:text-amber-200")}>
                    {keyCheck.scorePercent}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {keyCheck.correct}/{selectedBlock.answerCount} benar
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-background p-3">
                  <div className="text-xs uppercase text-muted-foreground">Jawaban terbaca</div>
                  <div className="mt-1 text-lg font-semibold">{keyCheck.detectedAnswers.length}</div>
                </div>
                <div className="rounded-lg bg-background p-3">
                  <div className="text-xs uppercase text-muted-foreground">Kurang</div>
                  <div className="mt-1 text-lg font-semibold">{keyCheck.missing}</div>
                </div>
                <div className="rounded-lg bg-background p-3">
                  <div className="text-xs uppercase text-muted-foreground">Extra</div>
                  <div className="mt-1 text-lg font-semibold">{keyCheck.extra}</div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {keyIssues.map((item) => (
                  <div key={item.index} className="rounded-lg bg-background px-3 py-2 text-sm">
                    <div className="font-semibold">Nomor {item.index + 1}</div>
                    <div className="text-muted-foreground">
                      Terbaca {item.detected ?? "-"}, seharusnya {item.expected}.
                    </div>
                  </div>
                ))}
                {!keyIssues.length && text && <div className="text-sm text-emerald-700 dark:text-emerald-200">Semua jawaban yang terbaca sesuai kunci.</div>}
                {!text && <div className="text-sm text-muted-foreground">Scan atau paste jawaban peserta untuk mulai koreksi.</div>}
              </div>
            </div>
          )}

          {numberCount ? (
            <div className="max-w-full overflow-auto rounded-lg border">
              <table className="min-w-full border-collapse bg-background text-sm">
                <thead className="bg-slate-100 text-xs uppercase text-muted-foreground dark:bg-slate-900">
                  <tr>
                    <th className="w-24 border-b px-3 py-2 text-left">Baris</th>
                    {Array.from({ length: maxCols }).map((_, index) => (
                      <th key={index} className="border-b px-3 py-2 text-left">
                        Kolom {index + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analysis.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b last:border-0">
                      <td className="bg-slate-50 px-3 py-2 font-semibold dark:bg-slate-900">Baris {rowIndex + 1}</td>
                      {Array.from({ length: maxCols }).map((_, colIndex) => {
                        const cell = row[colIndex];
                        const issues = issueMap.get(cellKey(rowIndex, colIndex)) ?? [];
                        return (
                          <td key={colIndex} className="px-2 py-2">
                            {cell ? (
                              <div
                                className={cn(
                                  "min-w-16 rounded-lg border px-3 py-2 font-semibold",
                                  issues.length
                                    ? "border-amber-300 bg-amber-50 text-amber-900 ring-2 ring-amber-200 dark:border-amber-500/50 dark:bg-amber-500/15 dark:text-amber-100 dark:ring-amber-500/20"
                                    : "border-emerald-100 bg-emerald-50/60 text-slate-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100"
                                )}
                                title={issues.map((issue) => `${issueTitle(issue)}: seharusnya ${formatNumber(issue.expected)}`).join(", ")}
                              >
                                {formatNumber(cell.value)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Scan gambar atau paste angka untuk melihat titik yang keluar dari pola.
            </div>
          )}

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-900">
              <div className="font-semibold">Pola terbaca</div>
              <div className="mt-3 space-y-2">
                {analysis.summaries.slice(0, 8).map((summary) => (
                  <div key={`${summary.axis}-${summary.lineNumber}`} className="flex items-center justify-between gap-3 rounded-lg bg-background px-3 py-2 text-sm">
                    <span>{summary.axis === "row" ? "Baris" : "Kolom"} {summary.lineNumber}</span>
                    <span className="font-semibold">
                      {summary.direction} {formatNumber(Math.abs(summary.step))}
                    </span>
                  </div>
                ))}
                {!analysis.summaries.length && <div className="text-sm text-muted-foreground">Pola belum terbaca.</div>}
              </div>
            </div>

            <div className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-900">
              <div className="font-semibold">Titik perlu review</div>
              <div className="mt-3 space-y-2">
                {analysis.issues.slice(0, 8).map((issue) => (
                  <div key={issue.id} className="rounded-lg bg-background px-3 py-2 text-sm">
                    <div className="font-semibold">
                      {issueTitle(issue)} - angka ke {issue.axis === "row" ? issue.col + 1 : issue.row + 1}
                    </div>
                    <div className="text-muted-foreground">
                      Terbaca {formatNumber(issue.detected)}, pola {issue.direction} {formatNumber(Math.abs(issue.step))}, seharusnya {formatNumber(issue.expected)}.
                    </div>
                  </div>
                ))}
                {!analysis.issues.length && <div className="text-sm text-muted-foreground">Belum ada titik salah yang terdeteksi.</div>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
