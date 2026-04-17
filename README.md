# Try Out Online

Platform try out / ujian online berbasis web. Dibangun dengan Next.js 14, Supabase, dan Tailwind CSS. Seluruh antarmuka dalam Bahasa Indonesia.

## Fitur

- **Admin:** Manajemen sesi ujian, soal (manual + import CSV), persetujuan siswa, analitik hasil.
- **Siswa:** Pendaftaran, login, ruang tunggu, mengerjakan ujian (mobile-first), melihat hasil.
- **Keamanan:** HttpOnly cookies via iron-session, bcrypt password, rate limiting login, timer server-side.

---

## Prasyarat

- Node.js 18+ dan npm
- Akun [Supabase](https://supabase.com) (free tier cukup)
- Akun [Vercel](https://vercel.com) (untuk deploy)

---

## Setup Lokal

### 1. Clone repository

```bash
git clone <repo-url>
cd stage-timer-dimas
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup database di Supabase

1. Buat project baru di [Supabase Dashboard](https://app.supabase.com)
2. Buka **SQL Editor**
3. Copy-paste isi file `scripts/setup-db.sql` dan jalankan

### 4. Generate bcrypt hash untuk password admin

```bash
node scripts/hash-password.js passwordkamu
```

Salin hash yang dihasilkan untuk dimasukkan ke env variable.

### 5. Setup environment variables

Buat file `.env.local` di root project (copy dari `.env.local.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$...hash-dari-langkah-4
ADMIN_WA_NUMBER=6281234567890
SESSION_SECRET=32-karakter-random-string-untuk-encrypt-cookie
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Cara mendapatkan Supabase keys:**
- `NEXT_PUBLIC_SUPABASE_URL`: Settings → API → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Settings → API → anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Settings → API → service_role key (rahasia!)

**Generate SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### 6. Jalankan development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## Cara Deploy ke Vercel

1. Push kode ke GitHub repository
2. Import project ke [Vercel](https://vercel.com/new)
3. Tambahkan semua environment variables di Vercel Dashboard → Settings → Environment Variables
4. Ganti `NEXT_PUBLIC_APP_URL` dengan URL Vercel Anda (misal: `https://tryout-app.vercel.app`)
5. Deploy!

---

## Penjelasan Environment Variables

| Variable | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key Supabase (aman di client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — **RAHASIA**, hanya di server |
| `ADMIN_USERNAME` | Username login admin |
| `ADMIN_PASSWORD_HASH` | Bcrypt hash dari password admin |
| `ADMIN_WA_NUMBER` | Nomor WA admin (server-side, format: 628xxx) |
| `NEXT_PUBLIC_ADMIN_WA_NUMBER` | Nomor WA admin (client-side, **isi nilai yang sama** dengan `ADMIN_WA_NUMBER`) |
| `SESSION_SECRET` | String acak 32 karakter untuk enkripsi cookie iron-session |
| `NEXT_PUBLIC_APP_URL` | URL publik aplikasi (tanpa trailing slash) |

---

## Struktur URL

| URL | Keterangan |
|---|---|
| `/` | Halaman beranda |
| `/daftar` | Formulir pendaftaran siswa |
| `/masuk` | Login siswa |
| `/tryout` | Ruang tunggu & instruksi ujian |
| `/tryout/soal` | Halaman mengerjakan ujian |
| `/tryout/hasil` | Halaman hasil ujian |
| `/admin/login` | Login admin |
| `/admin` | Dashboard admin |
| `/admin/sessions` | Manajemen sesi |
| `/admin/sessions/[id]/questions` | Manajemen soal per sesi |
| `/admin/sessions/[id]/analytics` | Analitik hasil per sesi |
| `/admin/approvals` | Persetujuan pendaftaran siswa |

---

## Troubleshooting

**Login admin gagal padahal password benar:**
- Pastikan `ADMIN_PASSWORD_HASH` adalah hasil dari `node scripts/hash-password.js` (bukan plain text)
- Pastikan tidak ada spasi/newline di akhir hash di env variable

**Data tidak muncul di database:**
- Pastikan SQL di `scripts/setup-db.sql` sudah dijalankan di Supabase SQL Editor
- Cek `SUPABASE_SERVICE_ROLE_KEY` sudah benar (bukan anon key)

**Session cookie tidak terbuat:**
- `SESSION_SECRET` minimal 32 karakter
- Di production, pastikan `NEXT_PUBLIC_APP_URL` menggunakan HTTPS

**Siswa tidak bisa login:**
- Pastikan status registrasi siswa sudah `approved`
- Password yang diberikan admin adalah 8 digit angka

**Build gagal di Vercel:**
- Pastikan semua environment variables sudah ditambahkan di Vercel
- Cek bahwa tidak ada typo di nama variable
