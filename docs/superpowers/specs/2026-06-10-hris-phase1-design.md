# Fase 1 HRIS — Self-Service, Master Data, Notifikasi In-App

Tanggal: 2026-06-10
Status: Disetujui user (pendekatan A, scope di bawah)

## Latar Belakang

Audit 2026-06-10 menemukan: 7 modul placeholder, 6 halaman `/my/*` berupa stub satu baris,
tidak ada UI CRUD master data, dan lonceng notifikasi di header hanya hiasan. Fase 1
membangun fondasi yang paling berdampak: self-service karyawan, pengelolaan master data,
dan notifikasi in-app.

## Keputusan Produk (sudah diputuskan user)

1. **Profil Saya**: karyawan boleh mengubah langsung data kontak — telepon, WhatsApp,
   email, alamat, nama bank, nomor rekening. Data inti (NIK, nomor karyawan, jabatan,
   departemen, tanggal masuk, status) read-only, hanya HR yang mengubah.
2. **Notifikasi in-app masuk Fase 1**, dipakai ulang oleh semua modul berikutnya.
3. **Pendekatan implementasi A**: mengikuti pola project yang ada — server component +
   HTML form POST ke API route; komponen client hanya untuk interaksi (dialog, kalender,
   lonceng). Bukan SPA-style, bukan server actions.

## Scope

### 1. Master Data — `/settings/organization` (permission `setting.manage`)

Satu halaman dengan tab: **Departemen, Posisi, Cabang, Shift, Hari Libur**.

- Tiap tab: tabel data (card view di layar < md), tombol Tambah dan Edit lewat dialog,
  tombol Nonaktifkan/Aktifkan.
- Soft delete via kolom `isActive` yang sudah ada (Holiday tidak punya `isActive` —
  hari libur boleh dihapus permanen karena tidak dirujuk tabel lain).
- API: `/api/settings/organization/departments|positions|branches|shifts|holidays`
  (POST create, PATCH update, PATCH toggle aktif; holiday: DELETE).
- Field per entitas mengikuti schema Prisma yang ada (mis. Posisi: name, levelOrder,
  flag is_spv/manager/partner/hr; Shift: code, name, startTime, endTime, toleransi telat;
  Cabang: name, address, lat/long).
- Tidak ada migrasi DB untuk bagian ini.

### 2. Self-Service — `/my/*` (semua user ber-`employeeId`)

Semua halaman menolak dengan pesan ramah bila user login tidak terhubung ke data karyawan.

- **`/my` (dashboard pribadi, halaman baru)**: kartu saldo cuti, ringkasan kehadiran bulan
  berjalan, jumlah approval menunggu tindakan saya, pengajuan cuti terakhir saya.
  Menjadi landing page role EMPLOYEE. Redirect `/dashboard` → `/my` bila user tidak punya
  `employee.view`.
- **`/my/profile`**: tampil semua data pribadi + form edit kontak (telepon, WhatsApp,
  email, alamat, bank, no. rekening). API `PATCH /api/my/profile` — server hanya menerima
  field whitelist tersebut dan hanya untuk `session.employeeId`. Perubahan dicatat ke
  `ActivityLog` via audit service.
- **`/my/leave`**: kartu saldo per tipe cuti tahun berjalan, riwayat pengajuan saya
  (dengan timeline approval via komponen `approval-timeline` yang ada), tombol ajukan
  cuti (pakai ulang `LeaveRequestDialog`).
- **`/my/attendance`**: kalender bulanan (pakai ulang `attendance-calendar`), ringkasan
  hadir/telat/absen/cuti bulan terpilih, navigasi bulan via query param `?month=YYYY-MM`.
- **`/my/approvals`**: tab "Menunggu Saya" (step approval PENDING yang ditujukan ke saya,
  by employeeId atau role code) dan "Riwayat" (step yang pernah saya tindak). Tombol
  Approve/Reject memanggil approval engine yang ada (`approval.service`), bukan jalur token.
  API `POST /api/my/approvals/[stepId]/action`.
- **`/my/evaluations`**: daftar `EvaluationAssignment` milik saya sebagai evaluator
  (status, target, cycle). Halaman isi `/my/evaluations/[assignmentId]`: render form via
  `dynamic-form-renderer`, submit menyimpan `EvaluationResponse` per pertanyaan + skor
  + tandai assignment SUBMITTED. API `POST /api/my/evaluations/[assignmentId]`.
- **`/my/payroll`**: empty state jujur ("slip gaji tersedia setelah modul payroll aktif" )
  — implementasi penuh di Fase 3.

### 3. Notifikasi In-App

- **Model baru `Notification`** (satu-satunya migrasi DB Fase 1):
  `id, userId (FK users), title, body, link?, readAt?, createdAt` + index `(userId, readAt)`.
- **Service** `notification-inapp.service.ts`: `notifyUser(userId, ...)` dan helper
  `notifyEmployee(employeeId, ...)` (lookup user by employeeId).
- **Titik emisi** (ditambahkan di alur yang sudah ada):
  - Cuti disubmit → notifikasi ke approver step aktif.
  - Step approved/rejected → notifikasi ke pemohon (dan approver step berikutnya).
  - Penugasan evaluasi dibuat → notifikasi ke evaluator. (Titik lain menyusul per fase.)
- **UI lonceng di header**: komponen client; badge jumlah belum dibaca; dropdown daftar
  10 terbaru; klik item → tandai dibaca + navigasi ke `link`; tombol "tandai semua dibaca";
  polling `GET /api/my/notifications` tiap 60 detik. Tanpa websocket.

### 4. Navigasi

- Sidebar dan menu mobile dikelompokkan: **"Menu Saya"** (Dashboard Saya, Profil, Cuti,
  Absensi, Approval, Penilaian — tampil untuk semua user ber-employeeId) dan
  **"Administrasi"** (item existing, difilter permission seperti sekarang).
- Tambah item "Organisasi" → `/settings/organization` di grup Administrasi.
- `route-permissions.ts` diperbarui: `/my` bebas permission (cukup login),
  `/api/my/*` cukup login, `/settings/organization` & API-nya butuh `setting.manage`.

## Arsitektur & Konvensi

- Pola file mengikuti yang ada: page = server component yang query Prisma langsung,
  mutasi = API route + redirect, logika bisnis di `src/server/services/*`.
- Komponen client baru: dialog CRUD master data, lonceng notifikasi, form profil
  (perlu state minimal), aksi approve/reject.
- Mobile-first untuk halaman baru: daftar memakai card di layar kecil, tabel di layar
  besar; tidak ada tabel yang memaksa scroll horizontal di `/my/*`.
- Warna memakai design token (`bg-background`, `text-muted-foreground`, dst.) agar
  kompatibel dark mode — tidak menambah utang `bg-white` hardcoded baru.

## Penanganan Error

- API route: pola yang ada — try/catch, 400 dengan `{ message }`; 401 bila tanpa sesi;
  403 bila bukan pemilik resource (mis. submit evaluasi orang lain).
- Mutasi master data memvalidasi dengan zod di service.

## Verifikasi

- `npx tsc --noEmit` dan `next build` harus lolos.
- Uji manual tiap modul dengan menjalankan aplikasi (admin + akun karyawan biasa).
- Test runner otomatis ditunda ke fase hardening (project belum punya infra test).

## Di Luar Scope Fase 1

- Payroll engine & slip gaji (Fase 3), overtime/reimbursement (Fase 2),
  recruitment/training/assets/documents/announcements (Fase 4),
  rate limiting/lupa password/dark mode menyeluruh (Fase 5).
