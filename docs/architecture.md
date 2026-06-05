# Arsitektur HRIS

## Modul Pondasi

- `auth.service.ts`: login, logout, session JWT, audit login.
- `employee.service.ts`: create/list employee dan validasi NIK.
- `nik.service.ts`: parsing NIK, validasi format, region, tanggal lahir, gender, duplikasi internal.
- `approval.service.ts`: request approval generic, step approval, reject, token sekali pakai.
- `leave.service.ts`: create leave, hitung durasi kerja, submit ke approval engine, queue notifikasi.
- `notification.service.ts`: queue, render template, retry status.
- `whatsapp.service.ts`: adapter WAM.
- `attendance.service.ts`: import Excel fingerprint ke raw logs.
- `evaluation.service.ts`: dynamic form dengan section dan question.
- `sequence-analyzer.ts`: analisis deret angka naik/turun dari hasil OCR tanpa answer key.
- `number-test-workbook.service.ts`: parser workbook Excel tes angka, membaca angka merah dari sheet `Asli` sebagai kunci jawaban.
- `number-test-key.ts`: evaluator jawaban angka dengan mode `auto`, `atas ke bawah`, dan `bawah ke atas`.
- `test-checker.service.ts`: template tes generic lama, saat ini tidak ditampilkan di UI.

## Flow Leave Approval

1. Employee membuat draft leave.
2. Submit membuat `approval_requests` dan `approval_steps`.
3. Sistem queue template `LEAVE_APPROVAL_REQUEST`.
4. Worker mengirim WA via WAM.
5. Approver memakai approval token.
6. Token divalidasi expiry dan `used_at`.
7. Approve/reject masuk `activity_logs`.

## Worker

Worker masih sederhana dan bisa dijalankan via npm script:

- `worker:notifications`
- `worker:attendance`
- `worker:ocr`

Untuk production, jalankan dengan process manager seperti PM2, systemd, Docker worker service, atau queue engine terpisah.
