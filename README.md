# HRIS Sederhana

Project HRIS berbasis Next.js App Router, TypeScript, MariaDB, Prisma, Tailwind CSS, shadcn/ui style components, Zod validation, custom JWT session, worker skeleton, local file storage, dan integrasi WhatsApp WAM.

## Fitur Awal

- Auth login/logout dengan JWT cookie.
- Role dan permission granular.
- Company, employee management, validasi NIK offline.
- Leave request, durasi hari kerja, generic approval engine.
- WhatsApp provider abstraction untuk WAM `https://wam.duodinamika.com`.
- Notification queue dan worker.
- Import Excel fingerprint ke raw attendance log.
- Dynamic evaluation form skeleton.
- Test checker skeleton untuk OMR/OCR.
- Payroll dan modul HRIS lain sebagai halaman awal siap dikembangkan.
- Migration SQL MariaDB eksplisit dengan `CHAR(36)`, `DATETIME`, `DECIMAL`, `JSON`, `TINYINT(1)`, InnoDB, utf8mb4.

## Prasyarat

- Node.js 22 LTS atau terbaru.
- MariaDB 10.6+.
- Database `duodinam_hris_nextjs`.

Di environment saat project dibuat, `node` dan `npm` belum tersedia di PATH, jadi dependency belum di-install dan build belum dijalankan.

## Setup

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Login awal:

```text
admin@example.com
Admin123!
```

## Environment

```env
DATABASE_URL="mysql://duodinam_hris:your-password@65.109.55.49:3306/duodinam_hris_nextjs"
JWT_SECRET="change-this-secret-at-least-32-chars"
APP_URL="http://localhost:3000"
WAM_BASE_URL="https://wam.duodinamika.com"
WAM_API_KEY=""
WAM_INSTANCE_ID=""
LOCAL_STORAGE_ROOT="./storage/uploads"
```

## WhatsApp WAM

Service utama ada di `src/server/services/whatsapp.service.ts`.

Endpoint yang dipakai:

- `POST /api/v1/message/send`
- `GET /api/v1/message/history`
- `GET /api/v1/instance/status`
- `POST /api/v1/instance/{instanceId}/qr`
- `POST /api/v1/instance/{instanceId}/pairing-code`
- `POST /api/v1/instance/{instanceId}/disconnect`
- `POST /api/v1/instance/{instanceId}/logout`

Kirim test dari aplikasi:

```text
/settings/whatsapp
```

Worker notification:

```bash
npm run worker:notifications
```

## Struktur Penting

```text
src/app
src/components
src/lib
src/server/services
src/server/jobs
prisma/schema.prisma
prisma/migrations/0001_init/migration.sql
prisma/seed.ts
storage/uploads
```

## Catatan Pengembangan

- Approval engine berada di `src/server/services/approval.service.ts` dan tidak spesifik ke cuti.
- Semua input API utama divalidasi dengan Zod.
- Raw log fingerprint disimpan di `attendance_raw_logs` dan tidak dihapus.
- Hasil OCR/OMR masih skeleton dan harus diarahkan ke review manual jika confidence rendah.
- File storage saat ini lokal, dengan helper di `src/lib/storage.ts` agar mudah dipindah ke S3-compatible storage.
