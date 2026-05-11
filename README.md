# Prayer Streak

## 1. Nama Project
- Prayer Streak

## 2. Tema Utama
- Membangun Konsistensi Ibadah Salat Melalui Habit Tracking dan Gamification

## 3. Deskripsi Singkat
Prayer Streak adalah web app modern yang membantu pengguna mencatat, memantau, dan meningkatkan konsistensi salat 5 waktu secara bertahap. Aplikasi ini tidak hanya menampilkan waktu salat, tetapi juga mengubah rutinitas salat menjadi kebiasaan terukur melalui checklist harian, streak, XP, level, achievement, dan statistik progres.

## 4. Latar Belakang
Banyak remaja dan anak muda muslim mengalami tantangan berikut:
- sering lupa waktu salat saat aktivitas padat,
- sulit menjaga konsistensi ibadah harian,
- motivasi menurun ketika rutinitas terputus beberapa hari,
- aplikasi jadwal salat yang ada lebih fokus pada informasi waktu, bukan tracking kebiasaan.

## 5. Problem Statement
Pengguna Muslim usia muda membutuhkan alat yang ringan dan konsisten untuk membentuk kebiasaan salat 5 waktu, bukan sekadar pengingat satu arah. Tanpa sistem pelacakan progres, reward, dan visualisasi perkembangan, sulit bagi mereka mempertahankan disiplin ibadah secara berkelanjutan.

## 6. Solution Statement
Prayer Streak menyelesaikan kebutuhan tersebut dengan menyediakan alur harian yang terstruktur:
- jadwal salat otomatis,
- checklist salat harian yang sederhana,
- perhitungan streak,
- sistem XP dan level,
- achievement berbasis milestone,
- statistik progres yang mudah dipahami.

Fokusnya adalah membantu pengguna tetap konsisten dengan feedback positif yang berulang.

## 7. Tujuan Project
- Menyediakan aplikasi tracking salat harian yang mudah digunakan.
- Membantu pengguna mengubah perilaku menunda menjadi kebiasaan bertahap.
- Menyediakan data perkembangan ibadah yang mudah dipahami setiap hari.
- Memperkuat disiplin dengan elemen gamifikasi yang ramah dan suportif.
- Menjadi fondasi yang siap berkembang untuk reminder, komunitas, dan fitur sosial.

## 8. Target Pengguna
Remaja dan anak muda muslim yang aktif secara digital dan ingin membangun konsistensi salat sebagai kebiasaan jangka panjang.

## 9. Value Proposition
- Tidak hanya pengingat salat, tapi juga alat tracking konsistensi.
- Mendorong kebiasaan melalui pencatatan dan umpan balik yang jelas.
- Memotivasi secara halus lewat XP, level, dan achievement.
- Menampilkan progres visual yang membuat perjalanan ibadah terasa nyata.
- Platform ringan, modern, dan personal.

## 10. Fitur Utama
- Register dan login pengguna.
- Jadwal salat otomatis.
- Checklist salat harian.
- Daily streak.
- XP dan level.
- Achievement dan badge.
- Statistik progres.
- Profile user.
- Reminder salat (untuk roadmap tahap berikutnya).

## 11. Fitur MVP
Untuk versi awal, yang wajib tersedia:
- Auth (register + login).
- Dashboard utama.
- Jadwal salat hari ini.
- Checklist salat 5 waktu.
- XP dan level dasar.
- Streak harian.
- Achievement dasar.
- Statistik sederhana.
- Profile.

## 12. Gamification Concept
- Checklist 1 salat = +10 XP.
- Menyelesaikan 5 salat dalam 1 hari = bonus +25 XP.
- Level naik berdasarkan total XP yang terkumpul.
- Streak bertambah saat 5 salat selesai dalam hari yang sama.
- Achievement terbuka saat pengguna mencapai milestone tertentu.

## 13. Achievement Example
- First Step: checklist salat pertama.
- Full Day: menyelesaikan 5 salat dalam sehari.
- 3 Days Streak: streak aktif 3 hari berturut-turut.
- 7 Days Consistent: streak aktif 7 hari.
- 30 Days Journey: streak aktif 30 hari.
- Level 5 Reached: mencapai level 5.

## 14. Tone dan Copywriting Aplikasi
- Aplikasi bersifat suportif, ringan, dan tidak menghakimi.
- Fokus pada proses dan kemajuan, bukan kompetisi berlebihan.
- Contoh microcopy:
  - "Mulai satu salat dulu, yang penting konsisten."
  - "Good job, kamu sudah catat salat hari ini."
  - "Lanjutkan ya, streak kamu lagi naik."
  - "Istirahat boleh, besok lanjut lagi. Yang penting kembali ke rutinitas."

## 15. UI/UX Direction
- Modern, clean, dan calm.
- Responsive untuk mobile-first.
- Cocok untuk anak muda dengan visual yang fresh dan ringan.
- Warna utama: emerald, slate, white, dengan accent gold.
- Dashboard informatif, jelas prioritasnya, dan tidak terlalu ramai.

## 16. Halaman Utama Web App
- Login
- Register
- Dashboard
- Statistics
- Achievements
- Profile

## 17. Dashboard Content
Dashboard menampilkan:
- Greeting user (sapaan dan nama).
- Waktu salat berikutnya.
- Jadwal salat hari ini.
- Checklist 5 salat.
- Current streak.
- XP total.
- Level saat ini.
- Progress harian.
- Achievement terbaru.

## 18. Statistik
Statistik yang akan ditampilkan:
- Total salat selesai minggu ini.
- Persentase konsistensi.
- Jumlah hari full completed.
- Streak aktif.
- Longest streak.

## 19. Database Entity Overview
Entitas inti:
- User
  - id, name, email, password, createdAt, updatedAt
- PrayerLog
  - id, userId, prayerType, date, status, prayedAt, xpEarned
- Achievement
  - id, slug, name, description, targetType, targetValue
- UserAchievement
  - id, userId, achievementId, unlockedAt
- XPHistory
  - id, userId, pointChange, reason, relatedDate, createdAt

## 20. Tech Stack
- Node.js
- Express.js
- JavaScript (CommonJS)
- EJS
- Tailwind CSS
- MySQL / MariaDB
- phpMyAdmin
- Prisma ORM
- express-session
- connect-flash
- bcrypt
- axios
- dayjs
- Aladhan API

## 21. Setup Environment (Ringkas)
- Buat database dengan nama: `prayer_streak`
- Siapkan `.env` dari `.env.example`.
- Install dependency proyek:
  ```bash
  npm install
  ```
- Generate Prisma client:
  ```bash
  npm run prisma:generate
  ```
- Jalankan mode pengembangan:
  ```bash
  npm run dev
  ```
- Aplikasi berjalan di:
  - http://localhost:5000

## 22. Implementasi Fase Awal (Setup Dasar)
- Setup project:
  - `prisma/schema.prisma` menggunakan MySQL (`provider = "mysql"`).
  - Server Express + EJS + session/flash sudah terhubung di `src/app.js` dan `src/server.js`.
  - Struktur folder dan file awal sudah dibuat (`src/`, `public/`, `views/`).
- Jalankan:
  ```bash
  npx prisma generate
  npm run dev
  ```
- Saat ini route aktif fokus pada:
  - `GET /` → `views/pages/home.ejs`.
- Catatan: saat ini dependency Prisma di environment ini kompatibel dengan konfigurasi Prisma 7, sehingga `url` datasource di schema dijalankan melalui `prisma.config.ts` (mengambil `DATABASE_URL` dari `.env`).
