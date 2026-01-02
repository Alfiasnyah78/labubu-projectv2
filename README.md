# AlmondSense 🌱

![AlmondSense Preview](/public/og-image.jpg)

## Data Akurat, Pertanian Lebih Cerdas

**AlmondSense** adalah platform teknologi agrikultur berbasis IoT dan AI untuk pemantauan lahan, analisis tanaman, dan pengambilan keputusan berbasis data. Kami membantu petani dan pelaku agribisnis meningkatkan produktivitas melalui teknologi yang mudah diakses dan akurat.

---

## 🌟 Tentang AlmondSense

### Visi
Menjadi pelopor solusi pertanian digital di Indonesia yang membantu petani dan pelaku agribisnis meningkatkan produktivitas melalui teknologi yang mudah diakses dan akurat.

### Filosofi
> "Teknologi untuk bumi yang lebih subur."

AlmondSense percaya bahwa data dapat membantu petani membuat keputusan yang lebih tepat, efisien, dan menguntungkan.

---

## ✨ Fitur Utama

### 🔌 Pemantauan IoT Real-time
- Sensor kelembaban tanah
- Monitoring suhu 24/7
- Data cuaca lokal terintegrasi

### 🧠 Analisis AI Prediktif
- Prediksi hasil panen
- Deteksi hama & penyakit dini
- Rekomendasi pupuk otomatis

### ☁️ Prakiraan Cuaca Lokal
- Cuaca 7 hari ke depan
- Alert hujan & peringatan ekstrem
- Data hiper-lokal

### 🌱 Manajemen Tanaman
- Jadwal tanam otomatis
- Tracking pertumbuhan
- Riwayat lahan lengkap

### 📊 Dashboard Analitik
- Grafik interaktif
- Laporan berkala
- Export data mudah

### 🔒 Keamanan Data
- Enkripsi end-to-end
- Backup harian otomatis
- Akses kontrol penuh

---

## 🚀 Kelebihan Platform

| Fitur | Deskripsi |
|-------|-----------|
| **Akurasi 98%** | Data sensor dengan tingkat akurasi tinggi |
| **Monitoring 24/7** | Pemantauan lahan tanpa henti |
| **500+ Hektar** | Sudah terpantau di seluruh Indonesia |
| **Multi-platform** | Akses via web, mobile, dan tablet |
| **Terjangkau** | Harga yang sesuai untuk petani & UMKM |
| **Support 24/7** | Tim dukungan siap membantu |

---

## 👥 Tim Kami

| Nama | Posisi | Peran |
|------|--------|-------|
| Muhammad Lutfi Alfian | CEO | Arah strategis & ekspansi pasar |
| Muhammad Raditya Anwar | CTO | Pengembangan IoT & AI |
| Raffuad Munawir | COO | Operasional & pelatihan petani |
| Naazila Alfa Syahrin | CPO | Pengembangan fitur & UX |
| Nur Indah | CFO | Keuangan & pendanaan |
| Tri Nurjulyanti | CMO | Branding & komunitas |

---

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui, Radix UI
- **State Management**: TanStack Query
- **Routing**: React Router
- **Build Tool**: Vite
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **Styling**: Tailwind CSS with custom design system

---

## 📚 Dokumentasi

| Dokumen | Deskripsi |
|---------|-----------|
| [Panduan Integrasi Supabase](docs/integrasi_supabase.md) | Step-by-step setup Supabase |
| [Panduan Deployment](docs/deploy.md) | Deploy ke Vercel, Docker, CI/CD |

---

## 🔄 CI/CD Pipeline

Project ini menggunakan GitHub Actions untuk otomatisasi:

### Workflows

| Workflow | Trigger | Fungsi |
|----------|---------|--------|
| `ci.yml` | Push/PR ke main | Lint, type check, build |
| `deploy-vercel.yml` | Push ke main | Deploy ke Vercel |
| `deploy-docker.yml` | Push/Tag | Build & push Docker image |

### Quick Start CI/CD

```bash
# Push ke main untuk trigger deployment
git push origin main

# Buat tag untuk release
git tag v1.0.0
git push origin v1.0.0
```

Lihat [Panduan Deployment](docs/deploy.md) untuk detail lebih lanjut.

---

## 🐳 Docker Deployment

### Menjalankan dengan Docker Compose

```bash
# Build dan jalankan
docker-compose up -d

# Akses aplikasi di
http://localhost:7903
```

### Menjalankan dengan Docker

```bash
# Build image
docker build -t almondsense \
  --build-arg VITE_SUPABASE_URL=https://xxx.supabase.co \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=eyJxxx... \
  .

# Jalankan container
docker run -d -p 7903:7903 --name almondsense-app almondsense
```

---

## 📁 Struktur Proyek

```
├── .github/
│   └── workflows/        # GitHub Actions CI/CD
│       ├── ci.yml
│       ├── deploy-vercel.yml
│       └── deploy-docker.yml
├── docs/
│   ├── integrasi_supabase.md
│   └── deploy.md
├── src/
│   ├── assets/           # Gambar & asset
│   │   └── team/         # Foto tim
│   ├── components/       # Komponen React
│   │   ├── ui/           # Komponen UI (Shadcn)
│   │   ├── Navbar.tsx
│   │   ├── HeroSection.tsx
│   │   ├── AboutSection.tsx
│   │   ├── ServicesSection.tsx
│   │   ├── TeamSection.tsx
│   │   ├── ContactSection.tsx
│   │   └── Footer.tsx
│   ├── integrations/     # Integrasi external
│   │   └── supabase/     # Supabase client & types
│   ├── lib/              # Utilities
│   │   ├── utils.ts
│   │   └── formStorage.ts
│   ├── pages/            # Halaman
│   │   ├── Index.tsx
│   │   ├── Auth.tsx
│   │   ├── CustomerDashboard.tsx
│   │   ├── AdminLogin.tsx
│   │   ├── AdminDashboard.tsx
│   │   └── NotFound.tsx
│   └── hooks/            # Custom hooks
├── supabase/
│   └── config.toml       # Supabase configuration
├── Dockerfile
├── docker-compose.yml
├── vercel.json
└── README.md
```

---

## 🔐 Admin Dashboard

Dashboard admin tersedia untuk mengelola pengajuan layanan dan users.

- **URL**: `/AdminLabubu`
- **Fitur Pengajuan**:
  - View, Edit, Delete pengajuan
  - Status tracking (Pending, Negosiasi, Success)
  - Statistik pengajuan
- **Fitur User Management**:
  - View semua users terdaftar
  - Edit profile users
  - Delete users

---

## 👤 Customer Portal

Portal pelanggan untuk tracking layanan yang diajukan.

- **URL**: `/pelanggan`
- **Fitur**:
  - Register & Login
  - Lihat status pengajuan
  - Update profile

---

## 🔧 Environment Variables

| Variable | Required | Deskripsi |
|----------|----------|-----------|
| `VITE_SUPABASE_URL` | ✅ | URL Supabase project |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Anon public key |

---

## 📞 Kontak

- **Website**: [almondsense.id](https://almondsense.id)
- **Email**: info@almondsense.id
- **Telepon**: +62 21 1234 5678

---

## 📄 License

© 2024 AlmondSense. All rights reserved.
