# Panduan Operasional HRIS

## Setup Awal

1. Login sebagai Super Admin.
2. Buka `Settings > Defaults`.
3. Isi company default, default shift, leave policy, annual quota, dan leave types. Default annual quota sistem adalah 16 hari.
4. Buka `Settings > Access Control`.
5. Pilih tab role, lalu aktifkan permission yang dibutuhkan untuk HRD, Manager, SPV, Employee, Auditor, dan role lain.
6. Logout dan login ulang setelah permission role diubah, karena permission dibaca dari session login.

## WhatsApp WAM

1. Buka `Settings > WhatsApp`.
2. Isi `Base URL`, atau gunakan default `https://wam.duodinamika.com`.
3. Jika belum punya instance, pakai `Create Instance` di Pairing Tools.
4. Jika sudah punya instance, isi `API Key` dan `Instance ID` manual.
5. Isi `Nomor Pairing` untuk generate pairing code.
6. Isi `Fallback Approval Phone` agar approval tetap terkirim jika data approver belum punya nomor WhatsApp.
7. Jalankan worker notifikasi:

```powershell
npm run worker:notifications
```

Worker ini memproses `notification_queue` setiap 5 detik dan mengirim pesan lewat WAM.

## Alur Cuti

1. HR/Admin membuka `Leave > Pengajuan`.
2. Klik `Pengajuan`.
3. Admin/HR bisa memilih karyawan. User non-admin otomatis memakai nama karyawan dari session.
4. Setelah submit, sistem membuat approval request dan token approve/reject.
5. WhatsApp dikirim ke SPV, Manager, atau HRD sesuai struktur approval.
6. Klik link approve/reject dari WhatsApp akan menjalankan aksi token.
7. Jika masih ada step berikutnya, sistem mengirim WhatsApp ke approver berikutnya.
8. Jika selesai, status cuti berubah menjadi `APPROVED` atau `REJECTED` dan karyawan menerima WhatsApp hasil akhir.
9. Untuk leave type yang `Potong saldo`, saldo pada `leave_balances` otomatis berkurang saat approval final `APPROVED`.
10. Jika policy tidak mengizinkan saldo minus dan saldo tidak cukup, submit cuti akan ditolak.

## Import/Export Karyawan

1. Buka `Employees`.
2. Klik `Export Excel` untuk mengambil data karyawan atau template kolom.
3. Untuk import, upload file `.xlsx`, `.xls`, atau `.csv` pada panel `Import Excel Karyawan`.
4. Import memakai `employee_number` sebagai kunci upsert. Jika nomor sudah ada, data diupdate; jika belum ada, data dibuat.
5. Kolom yang didukung antara lain `employee_number`, `full_name`, `nik`, `gender`, `birth_place`, `birth_date`, `phone`, `whatsapp_number`, `email`, `address`, `join_date`, `employment_status`, `branch`, `department`, `position`, `supervisor_employee_number`, `bank_name`, `bank_account_number`, `npwp`, `bpjs_kesehatan`, `bpjs_ketenagakerjaan`, dan `fingerprint_user_id`.
6. Department, position, dan branch otomatis dibuat jika nama belum ada.
7. Saldo cuti tahun berjalan otomatis dibuat untuk karyawan yang diimport.

## Builder Evaluasi

1. Buka `Evaluations`.
2. List form tampil lebih dulu.
3. Klik `Buat Form Baru` untuk membuka builder.
4. Atur section, jumlah kolom, field, label, tipe jawaban, opsi, bobot, required, placeholder, dan lebar field.
5. Klik field untuk mengubah properti. Preview field berubah sesuai tipe jawaban.
6. Form lama bisa diedit lewat tombol `Edit Builder`.

## Scan OCR Deret Angka

1. Buka `Scan OCR`.
2. Klik `Muat Default` untuk membaca workbook kunci dari `TEST_ANSWER_WORKBOOK_PATH`, atau `Upload Excel`.
3. Sistem membaca sheet `Asli 1` sampai `Asli 10` dan mengambil angka merah sebagai kunci.
4. Setiap kolom diperlakukan sebagai satu pola aktif: `Atas ke bawah` atau `Bawah ke atas`.
5. Default koreksi adalah `Atas ke bawah`. Mode auto baru mencoba `Bawah ke atas` hanya jika hasil `Atas ke bawah` benar-benar nol benar.
6. Pilih sheet/kolom kunci, lalu pilih arah `Auto: atas dulu`, `Atas ke bawah`, atau `Bawah ke atas`.
7. Buka kamera ponsel atau upload foto jawaban peserta.
8. Sistem menjalankan OCR, mengambil angka jawaban, lalu membandingkan dengan kunci merah Excel.
9. Jika OCR ikut membaca angka soal, aktifkan `Abaikan angka 1 digit`.
10. Jika OCR kurang rapi, koreksi teks di panel `Teks OCR / angka manual`; hasil koreksi berubah otomatis.

Modul template test/answer key sementara tidak ditampilkan di UI karena pekerjaan test numerik lebih praktis dibuat di Excel/Word, lalu dinilai dari hasil scan.

## Catatan Produksi

- Set `APP_URL` ke URL HRIS yang bisa dibuka approver dari WhatsApp.
- Set `TEST_ANSWER_WORKBOOK_PATH` jika workbook kunci tes berada di lokasi selain default.
- Di Vercel, gunakan `TEST_ANSWER_WORKBOOK_URL` atau upload Excel manual karena path `\\Ddserver\...` tidak bisa diakses dari cloud.
- Jalankan Next.js dan worker notifikasi dengan process manager.
- Pastikan profil SPV, Manager, HRD, dan karyawan punya `whatsapp_number`.
- Jika role/permission berubah, user perlu login ulang agar session memuat permission terbaru.
- Untuk kamera ponsel di browser mobile, gunakan HTTPS atau domain yang dianggap secure context oleh browser. Jika belum memakai HTTPS, gunakan tombol upload foto/capture dari ponsel.
