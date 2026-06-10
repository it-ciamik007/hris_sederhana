# Fase 2 HRIS — Overtime & Reimbursement

Tanggal: 2026-06-10
Status: Disetujui user

## Latar Belakang

Lanjutan roadmap setelah Fase 1 (self-service, master data, notifikasi in-app).
Halaman `/overtime` dan `/reimbursement` masih placeholder tanpa API dan tanpa tabel
transaksi. Infrastruktur file: tabel `files` ada tetapi belum pernah ditulis; belum ada
route unduh file.

## Keputusan Produk (sudah diputuskan user)

1. **Lampiran bukti reimbursement disimpan di database (BLOB)** — kompatibel dengan
   deployment Vercel (disk lokal tidak persisten). Batas 5 MB per file.
2. **Alur approval sama seperti cuti**: karyawan memilih atasan → atasan menyetujui →
   HRD final. Memakai ulang approval engine yang ada.
3. **Reimbursement punya status PAID**: setelah APPROVED, HR/Finance (permission
   `payroll.process`) menandai "Sudah Dibayar"; tercatat `paidAt` dan `paidBy`.
4. Struktur modul: self-service di `/my/*`, daftar admin di `/overtime` dan
   `/reimbursement`, approval lewat inbox `/my/approvals`.

## Scope

### 1. Database — migrasi `0009_overtime_reimbursement` (atau nomor berikutnya yang tersedia)

Semua tabel baru `COLLATE=utf8mb4_unicode_ci` (lihat konvensi project).

- **`overtime_requests`**: id, employee_id (FK employees), selected_approver_id (FK
  employees, NULL), overtime_date DATE, start_time VARCHAR(5), end_time VARCHAR(5),
  duration_minutes INT (dihitung server; lintas tengah malam berarti end < start →
  tambah 24 jam), reason TEXT, status VARCHAR(50) default DRAFT
  (DRAFT|WAITING_APPROVAL|APPROVED|REJECTED), approval_request_id (FK
  approval_requests, NULL), submitted_at, created_at, updated_at.
- **`reimbursement_requests`**: id, employee_id, reimbursement_type_id (FK
  reimbursement_types), selected_approver_id, expense_date DATE, amount DECIMAL(15,2),
  description TEXT, attachment_file_id (FK files, NULL), status VARCHAR(50) default
  DRAFT (DRAFT|WAITING_APPROVAL|APPROVED|REJECTED|PAID), paid_at DATETIME NULL,
  paid_by CHAR(36) NULL (FK users), approval_request_id, submitted_at, created_at,
  updated_at.
- **`file_contents`**: file_id CHAR(36) PK (FK files), data LONGBLOB. Terpisah dari
  `files` agar query metadata tidak memuat blob.
- Prisma: model `OvertimeRequest`, `ReimbursementRequest`, `FileContent` + relasi
  balik di `Employee`, `ReimbursementType`, `ApprovalRequest`, `File`, `User`.

### 2. Infrastruktur File

- **`src/server/services/file.service.ts`**:
  - `saveUploadedFile({ file, companyId, uploadedBy })` — validasi ukuran ≤ 5 MB dan
    mime ∈ {image/jpeg, image/png, image/webp, application/pdf}; tulis `files`
    (storageProvider "DB", storedName = uuid + ekstensi, storagePath = "db") +
    `file_contents` dalam transaksi; kembalikan record `files`.
  - `getFileWithContent(id)` — metadata + blob untuk route unduh.
- **`GET /api/files/[id]`** — wajib login (cukup sesi; id UUID tidak bisa ditebak),
  set Content-Type & Content-Disposition inline.

### 3. Service Modul

- **`overtime.service.ts`**: `createOvertimeRequest` (zod; hitung durationMinutes;
  approver wajib & ≠ diri sendiri, satu perusahaan — pola sama dengan leave.service),
  `submitOvertimeRequest` (status DRAFT → buat approval request 2 step:
  DIRECT_SPV(selectedApprover) → HRD(role); update status WAITING_APPROVAL;
  notifikasi in-app ke approver).
- **`reimbursement.service.ts`**: `createReimbursementRequest` (validasi
  `maxAmount` dan `requiresAttachment` dari tipe), `submitReimbursementRequest`
  (sama seperti overtime), `markReimbursementPaid` (hanya status APPROVED → PAID,
  catat paidAt/paidBy, notifikasi in-app ke pemohon).
- **`approval.service.ts`** — refactor `handleModuleApprovalAfterAction` menjadi
  dispatcher per module: handler `leave` (perilaku sekarang, tidak berubah), handler
  baru `overtime` dan `reimbursement` (approved → set APPROVED + notify pemohon;
  rejected → REJECTED + notify dengan catatan; next → notify approver berikutnya).
  Notifikasi WhatsApp untuk overtime/reimbursement DITUNDA (template WA belum ada) —
  hanya in-app. Link approval token WA tetap hanya untuk leave.

### 4. API Routes

Pola form POST + redirect 303 (konvensi project). Semua `/api/my/*` cukup login.

- `POST /api/my/overtime` — create (intent=submit → langsung submit); employeeId
  selalu `session.employeeId`.
- `POST /api/my/overtime/[id]/submit` — submit draft milik sendiri.
- `POST /api/my/reimbursement` — multipart: field + file `attachment`; simpan file
  dulu (bila ada) lalu create; intent=submit didukung.
- `POST /api/my/reimbursement/[id]/submit` — submit draft milik sendiri.
- `POST /api/reimbursement/[id]/pay` — tandai PAID; permission `payroll.process`
  (cek manual di route karena route-permissions prefix `/api/...` belum memetakan
  path ini; tambahkan entry `{ prefix: "/api/reimbursement", permission:
  "payroll.view" }` dan cek `payroll.process` di dalam handler).
- `GET /api/files/[id]` — unduh file (login).

### 5. Halaman

- **`/my/overtime`** (ganti nav): kartu ringkasan (total jam APPROVED tahun
  berjalan, menunggu approval), dialog pengajuan (tanggal, jam mulai, jam selesai,
  alasan, pilih atasan — durasi dihitung server), riwayat dengan timeline approval
  (`<details>` seperti /my/leave), tombol Submit untuk DRAFT.
- **`/my/reimbursement`**: kartu ringkasan (total nominal APPROVED+PAID tahun
  berjalan, menunggu), dialog pengajuan (tipe, tanggal, nominal, keterangan, upload
  bukti — `<input type="file">`; form `encType="multipart/form-data"`), riwayat +
  link "Lihat bukti" ke `/api/files/[id]`, badge PAID.
- **`/overtime`** (admin, ganti placeholder; permission `leave.view`): filter status +
  pencarian nama, tabel md+/card mobile, kolom: karyawan, tanggal, jam, durasi,
  alasan, status. Ringkasan total menit hasil filter.
- **`/reimbursement`** (admin, ganti placeholder; permission `payroll.view`): filter
  status + pencarian, kolom: karyawan, tipe, tanggal, nominal, bukti (link), status;
  tombol "Tandai Dibayar" untuk baris APPROVED (hanya tampil bila punya
  `payroll.process`).
- **`/settings/organization`**: tab ke-6 "Tipe Reimbursement" (name, maxAmount,
  requiresAttachment, isActive) — ikut pola organization.service (entity
  `reimbursement-types`).
- **`/my/approvals`**: perluas detail untuk module `overtime` (nama, tanggal, jam,
  durasi, alasan) dan `reimbursement` (nama, tipe, nominal, keterangan, link bukti).
- **Navigasi**: tambah "Lembur Saya" `/my/overtime` dan "Reimbursement Saya"
  `/my/reimbursement` di grup Menu Saya. Item admin "Overtime" `/overtime`
  (leave.view) dan "Reimbursement" `/reimbursement` (payroll.view) di grup
  Administrasi.

### 6. Tanpa permission baru

Memakai permission yang sudah di-seed: `leave.view` (admin overtime), `payroll.view`
(admin reimbursement), `payroll.process` (tandai dibayar). Self-service cukup login +
employeeId.

## Penanganan Error

Pola project: zod di service, try/catch di route → 400 `{ message }`; 401 tanpa sesi;
403 bukan pemilik/bukan approver/tanpa permission; 404 resource tidak ada.
Upload: tolak > 5 MB dan mime di luar daftar dengan pesan jelas.

## Verifikasi

- `npx tsc --noEmit` dan `npx next build` lolos.
- Smoke test HTTP: login admin → halaman baru 200; POST create overtime &
  reimbursement (dengan dan tanpa file) → 303; GET file → 200 dengan mime benar;
  data uji dibersihkan.
- Uji manual UI di browser oleh user (termasuk viewport ponsel).

## Di Luar Scope Fase 2

Payroll engine (Fase 3 — akan mengonsumsi durasi lembur APPROVED dan reimbursement),
notifikasi WhatsApp untuk overtime/reimbursement (perlu template), kompensasi lembur
dalam rupiah, recruitment/training/assets/documents/announcements (Fase 4).
