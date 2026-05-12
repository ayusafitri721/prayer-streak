# Project Overview

## AI Quick Context

Gunakan bagian ini kalau file dibaca AI/coding agent dan butuh konteks cepat.

- Project name: `prayer-streak`
- App type: server-rendered web app
- Stack: Node.js, Express, EJS, Tailwind CSS, Prisma, MySQL
- Architecture: `route -> controller -> service -> view`
- Entry point: `src/server.js`
- App bootstrap: `src/app.js`
- Main feature menus: dashboard, statistik, achievement, quran, hadis, doa, profile
- Main persistence status:
  - `User` auth sudah ke Prisma
  - progress salat, XP, streak, achievement, statistik masih in-memory
- Private routes require session auth via `requireAuth`
- View engine: EJS
- Frontend pattern: server-rendered HTML + browser JS di `public/js/main.js`
- Database schema source: `prisma/schema.prisma`
- Important gap: database schema sudah ada, tetapi progress service belum memakai Prisma
- Dashboard insight block: konten harian campuran ayat dan hadis bertema disiplin/kebiasaan
- Doa page source: Doa JSON Dataset dengan fallback lokal bila API gagal

## AI Reading Notes

- Dokumen ini adalah source of truth ringkas untuk struktur dan arsitektur project.
- Jika AI mau menambah fitur, ikuti pola folder yang sudah ada.
- Jika AI menyentuh fitur progress salat, prioritaskan Prisma daripada state memory baru.
- Jangan asumsikan project ini API-first; alur utamanya adalah `res.render(...)` + redirect + flash.

## Ringkasan Singkat

Prayer Streak adalah web app Express + EJS untuk tracking konsistensi salat dengan elemen gamifikasi seperti XP, level, streak, achievement, statistik, serta konten Qur'an dan hadis.

## Struktur Folder

```text
prayer-streak/
├── prisma/
│   ├── migrations/
│   │   ├── 20260511030601_init/
│   │   └── 20260511045303_add_user_phone/
│   └── schema.prisma
├── public/
│   ├── assets/
│   │   └── login-illustration.svg
│   └── js/
│       └── main.js
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── doaController.js
│   │   ├── hadisController.js
│   │   ├── mainController.js
│   │   └── quranController.js
│   ├── middlewares/
│   │   └── flash.js
│   ├── routes/
│   │   ├── achievements.js
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── doa.js
│   │   ├── hadis.js
│   │   ├── main.js
│   │   ├── profile.js
│   │   ├── quran.js
│   │   └── statistics.js
│   ├── services/
│   │   ├── doaService.js
│   │   ├── hadisService.js
│   │   ├── prayerProgressService.js
│   │   ├── quranService.js
│   │   ├── reflectionService.js
│   │   └── userService.js
│   ├── utils/
│   │   └── prisma.js
│   ├── app.js
│   ├── input.css
│   └── server.js
├── views/
│   ├── layouts/
│   │   └── main.ejs
│   ├── pages/
│   │   ├── achievements.ejs
│   │   ├── dashboard.ejs
│   │   ├── doa/
│   │   ├── home.ejs
│   │   ├── profile.ejs
│   │   ├── statistics.ejs
│   │   ├── auth/
│   │   ├── hadis/
│   │   └── quran/
│   └── partials/
│       └── topbar.ejs
├── .env.example
├── package.json
├── prisma.config.ts
└── README.md
```

## Stack dan Arsitektur

- Backend: Node.js, Express 5, CommonJS
- View layer: EJS + `express-ejs-layouts`
- Styling: Tailwind CSS v4
- Database: MySQL
- ORM: Prisma 5
- Auth/session: `express-session`, `connect-flash`, `bcrypt`
- HTTP client: `axios`

Arsitektur yang dipakai adalah monolith MVC ringan:

- `routes/` menerima request dan mendefinisikan URL
- `controllers/` mengatur flow request/response
- `services/` berisi business logic dan integrasi eksternal
- `views/` merender UI server-side dengan EJS

## Entry Point dan Alur Runtime

- Entry point aplikasi: `src/server.js`
- Bootstrap Express: `src/app.js`
- Prisma client singleton: `src/utils/prisma.js`

Alur utama:

1. `src/server.js` menjalankan server dan memanggil `seedAdmin()`
2. `src/app.js` memasang middleware, session, flash, layout, static assets, lalu mount routes
3. Route memanggil controller
4. Controller memanggil service
5. Hasil akhirnya hampir selalu `res.render(...)` atau redirect + flash message

## Routing

Route aktif saat ini:

- `/` -> home
- `/login`, `/register`, `/logout` -> auth
- `/dashboard` -> dashboard utama
- `/dashboard/prayer/:prayer/complete` -> checklist salat
- `/statistics` -> statistik
- `/achievements` -> achievement
- `/profile` -> profil
- `/quran` dan `/quran/:nomor` -> daftar/detail surat
- `/hadis`, `/hadis/:slug`, `/hadis/:slug/:number` -> daftar/detail hadis
- `/doa` -> kumpulan doa harian dan doa istiqamah

Proteksi auth memakai middleware di `src/middlewares/flash.js`:

- `requireAuth`
- `requireGuest`

## Config dan Environment

Variabel penting di `.env.example`:

- `PORT`
- `DATABASE_URL`
- `SESSION_SECRET`
- `PRAYER_API_BASE_URL`

Catatan:

- `DATABASE_URL` dipakai oleh Prisma melalui `schema.prisma` dan `prisma.config.ts`
- `PRAYER_API_BASE_URL` dipakai untuk jadwal salat dinamis lewat EQuran Shalat API
- lokasi utama jadwal salat diambil dari browser user dan disimpan di session; env dipakai sebagai fallback, default-nya `DKI Jakarta / Kota Jakarta`
- Session secret punya fallback default di `src/app.js`, tetapi untuk production sebaiknya wajib lewat env

## Database dan Data Layer

Schema Prisma mendefinisikan 5 model:

- `User`
- `PrayerLog`
- `Achievement`
- `UserAchievement`
- `XPHistory`

Relasi inti:

```text
User 1 --- * PrayerLog
User 1 --- * XPHistory
User 1 --- * UserAchievement * --- 1 Achievement
```

Migration yang ada:

- `20260511030601_init` membuat tabel inti
- `20260511045303_add_user_phone` menambah kolom `phone` pada `User`

## Status Implementasi Data

Ada gap penting antara schema dan runtime:

- `userService.js` sudah memakai Prisma untuk user auth, dengan fallback ke memory bila Prisma tidak tersedia
- `prayerProgressService.js` belum memakai Prisma
- XP, level, streak, achievement, statistik, dan checklist salat masih disimpan in-memory per proses Node.js

Dampaknya:

- data progres hilang saat server restart
- tabel `PrayerLog`, `Achievement`, `UserAchievement`, dan `XPHistory` belum menjadi source of truth runtime
- statistik saat ini dihitung dari `Map()` di memory, bukan dari database

## Pola Kode dan Konvensi

- Penamaan file menggunakan camelCase untuk JS dan lowercase per fitur untuk route
- Struktur per fitur mengikuti pola `route -> controller -> service -> view`
- Controller tipis, service memegang logika utama
- Auth flow berbasis redirect + flash message, bukan JSON API
- Hampir semua response adalah `res.render(...)`
- Error handling sederhana: `try/catch`, redirect, dan `req.flash("error", ...)`
- Logging masih memakai `console.log` dan `console.error`

## Reusable Components

Komponen yang sudah bisa dipakai ulang:

- `src/middlewares/flash.js` untuk auth guard dan global locals EJS
- `src/utils/prisma.js` untuk Prisma client singleton
- `src/services/userService.js` untuk register, login, cari user, seed admin
- `src/services/quranService.js` untuk daftar/detail surat dengan normalisasi response
- `src/services/hadisService.js` untuk daftar/detail hadis dan daily hadis
- `src/services/doaService.js` untuk mengambil dan normalisasi data doa dari dataset JSON berbahasa Indonesia
- `src/services/reflectionService.js` untuk konten dashboard campuran ayat/hadis bertema disiplin
- `views/layouts/main.ejs` dan `views/partials/topbar.ejs` untuk layout global
- `public/js/main.js` untuk interaksi client seperti audio ayat, countdown, qibla compass, share/download

## Integrasi Eksternal

Service eksternal yang aktif:

- EQuran API: `https://equran.id/api/v2`
- Hadith API: `https://api.hadith.gading.dev`

Integrasi yang terlihat disiapkan tapi belum aktif:

- EQuran Shalat API lewat `PRAYER_API_BASE_URL`

## Frontend Notes

UI dirender server-side dengan EJS, lalu diperkaya JS di browser. Fitur frontend yang sudah ada:

- mobile sidebar
- countdown salat berikutnya
- qibla compass berbasis geolocation + device orientation
- audio player ayat
- share/download ayat dan hadis sebagai gambar
- filter pencarian surat
- pencarian doa pada halaman `Doa`

## DX dan Tooling

Script penting di `package.json`:

- `npm run dev` -> jalankan server + Tailwind watcher
- `npm start` -> production start
- `npm run css` -> watcher Tailwind
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:studio`

Temuan tooling:

- belum ada test framework
- belum ada ESLint/Prettier
- belum ada CI/CD config yang terlihat di repo

## Conventions yang Harus Diikuti

- Simpan flow web app di jalur server-rendered, bukan SPA/API-first
- Gunakan middleware auth yang sudah ada untuk halaman private/public
- Untuk halaman baru, ikuti pola route/controller/service/view yang sama
- Pertahankan flash message untuk feedback sukses/gagal
- Kalau fitur baru menyentuh progres salat, sebaiknya lanjutkan ke Prisma, bukan menambah state in-memory baru

## Hal yang Perlu Diperhatikan

- `prayerProgressService.js` masih mock/in-memory walau database sudah disiapkan
- Seed admin menggunakan credential hardcoded default
- Tidak ada test untuk auth, progress, atau integrasi API
- Tidak ada pemisahan config production/dev yang kuat
- jadwal salat sekarang diambil dari EQuran Shalat API dengan fallback ke jadwal default aplikasi saat API gagal

## Siap untuk Fitur Baru

Konteks proyek sudah cukup jelas. Area paling strategis untuk pengembangan berikutnya adalah memindahkan progress salat, XP, streak, achievement, dan statistik dari memory ke Prisma agar state aplikasi benar-benar persisten.
