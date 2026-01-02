# Panduan Deployment AlmondSense

## Daftar Isi
1. [Overview Arsitektur](#overview-arsitektur)
2. [Prasyarat](#prasyarat)
3. [Deploy ke Vercel](#deploy-ke-vercel)
4. [Deploy dengan Docker](#deploy-dengan-docker)
5. [CI/CD dengan GitHub Actions](#cicd-dengan-github-actions)
6. [Environment Variables](#environment-variables)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Overview Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                        GitHub Repository                      │
│                              │                                │
│                    ┌─────────┴─────────┐                     │
│                    │   GitHub Actions   │                     │
│                    │      (CI/CD)       │                     │
│                    └─────────┬─────────┘                     │
│                              │                                │
│            ┌─────────────────┼─────────────────┐             │
│            ▼                 ▼                 ▼              │
│     ┌──────────┐     ┌──────────┐     ┌──────────┐          │
│     │  Vercel  │     │  Docker  │     │   VPS    │          │
│     │ (Static) │     │   Hub    │     │  Server  │          │
│     └──────────┘     └──────────┘     └──────────┘          │
│                              │                                │
│                    ┌─────────┴─────────┐                     │
│                    │     Supabase      │                     │
│                    │   (Backend/DB)    │                     │
│                    └───────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Prasyarat

### Tools yang Dibutuhkan
- [Node.js](https://nodejs.org/) v18+
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) (untuk deploy Docker)
- [Vercel CLI](https://vercel.com/docs/cli) (opsional)

### Akun yang Dibutuhkan
- [GitHub](https://github.com) - untuk version control & CI/CD
- [Vercel](https://vercel.com) - untuk hosting (gratis)
- [Supabase](https://supabase.com) - untuk backend (gratis tier tersedia)

---

## Deploy ke Vercel

### Metode 1: Deploy Langsung dari GitHub

#### Langkah 1: Import Project
1. Login ke [Vercel Dashboard](https://vercel.com/dashboard)
2. Klik **Add New** → **Project**
3. Pilih **Import Git Repository**
4. Pilih repository AlmondSense Anda
5. Klik **Import**

#### Langkah 2: Konfigurasi Project
1. **Framework Preset**: Pilih **Vite**
2. **Root Directory**: Biarkan kosong (default)
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`

#### Langkah 3: Environment Variables
Tambahkan environment variables berikut:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Langkah 4: Deploy
1. Klik **Deploy**
2. Tunggu proses build selesai (2-3 menit)
3. Anda akan mendapat URL production seperti `https://almondsense.vercel.app`

### Metode 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login ke Vercel
vercel login

# Deploy (development)
vercel

# Deploy (production)
vercel --prod
```

---

## Deploy dengan Docker

### Langkah 1: Build Docker Image

```bash
# Build image
docker build -t almondsense:latest \
  --build-arg VITE_SUPABASE_URL=https://xxxxx.supabase.co \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=eyJxxx... \
  .

# Atau gunakan docker-compose
docker-compose build
```

### Langkah 2: Run Container

```bash
# Run dengan docker
docker run -d -p 80:80 --name almondsense almondsense:latest

# Atau dengan docker-compose
docker-compose up -d
```

### Langkah 3: Deploy ke VPS

```bash
# SSH ke server
ssh user@your-server.com

# Pull image dari GitHub Container Registry
docker pull ghcr.io/yourusername/almondsense:latest

# Stop container lama
docker stop almondsense || true
docker rm almondsense || true

# Run container baru
docker run -d \
  --name almondsense \
  --restart unless-stopped \
  -p 80:80 \
  ghcr.io/yourusername/almondsense:latest
```

---

## CI/CD dengan GitHub Actions

### Struktur Workflows

```
.github/
└── workflows/
    ├── ci.yml              # Lint, type check, build
    ├── deploy-vercel.yml   # Deploy ke Vercel
    └── deploy-docker.yml   # Build & push Docker image
```

### Setup GitHub Secrets

Buka **Repository Settings** → **Secrets and variables** → **Actions**

#### Secrets untuk Build
| Secret Name | Deskripsi |
|------------|-----------|
| `VITE_SUPABASE_URL` | URL project Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon public key Supabase |

#### Secrets untuk Vercel Deploy
| Secret Name | Cara Mendapatkan |
|------------|------------------|
| `VERCEL_TOKEN` | [Vercel Settings](https://vercel.com/account/tokens) → Create Token |
| `VERCEL_ORG_ID` | Jalankan `vercel` di project, lalu lihat `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Jalankan `vercel` di project, lalu lihat `.vercel/project.json` |

### Cara Kerja CI/CD

#### 1. CI Workflow (`ci.yml`)
Berjalan saat: **Push** dan **Pull Request** ke branch `main`

```
Push/PR → Lint → Type Check → Build → Upload Artifact
```

#### 2. Vercel Deploy (`deploy-vercel.yml`)
Berjalan saat: **Push** ke branch `main`

```
Push to main → Build → Deploy to Vercel Production
```

#### 3. Docker Deploy (`deploy-docker.yml`)
Berjalan saat: **Push** ke branch `main` atau **Release tag**

```
Push/Tag → Build Docker Image → Push to GitHub Container Registry
```

### Menggunakan CI/CD

#### Automatic Deploy (Recommended)
Setiap push ke branch `main` akan otomatis:
1. Menjalankan lint dan type check
2. Build aplikasi
3. Deploy ke Vercel
4. Build dan push Docker image

#### Manual Deploy
```bash
# Trigger workflow manual dari GitHub
# Repository → Actions → Workflow → Run workflow
```

### Contoh Workflow Log

```
✓ Checkout repository
✓ Setup Node.js
✓ Install dependencies
✓ Run ESLint
✓ Run TypeScript type check
✓ Build application
✓ Deploy to Vercel
```

---

## Environment Variables

### Development (`.env`)
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Production (Vercel/Docker)
| Variable | Wajib | Deskripsi |
|----------|-------|-----------|
| `VITE_SUPABASE_URL` | ✅ | URL Supabase project |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Anon/public key Supabase |

### GitHub Actions Secrets
| Secret | Wajib | Untuk |
|--------|-------|-------|
| `VITE_SUPABASE_URL` | ✅ | Build |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Build |
| `VERCEL_TOKEN` | ⚪ | Deploy Vercel |
| `VERCEL_ORG_ID` | ⚪ | Deploy Vercel |
| `VERCEL_PROJECT_ID` | ⚪ | Deploy Vercel |

---

## Monitoring & Maintenance

### Vercel Analytics
1. Buka Vercel Dashboard → Project → **Analytics**
2. Lihat metrics seperti:
   - Page views
   - Visitors
   - Performance scores

### Supabase Monitoring
1. Buka Supabase Dashboard → **Reports**
2. Monitor:
   - Database usage
   - API requests
   - Auth events

### Health Check
```bash
# Cek status aplikasi
curl -I https://your-app.vercel.app

# Response yang diharapkan
HTTP/2 200
```

### Update Dependencies
```bash
# Cek outdated packages
npm outdated

# Update minor versions
npm update

# Update major versions (hati-hati!)
npx npm-check-updates -u
npm install
```

---

## Troubleshooting

### Build Error: Module not found
```
Error: Cannot find module '@/components/...'
```
**Solusi**: Pastikan path alias di `vite.config.ts` sudah benar

### Deploy Error: Environment variables missing
```
Error: VITE_SUPABASE_URL is not defined
```
**Solusi**: Tambahkan environment variables di Vercel/GitHub Secrets

### 404 Error pada Refresh (Vercel)
**Penyebab**: Single Page Application routing issue
**Solusi**: Pastikan `vercel.json` sudah ada dengan konfigurasi rewrites:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Docker Build Failed
```
Error: npm ci failed
```
**Solusi**: 
1. Pastikan `package-lock.json` sudah commit
2. Clear Docker cache: `docker system prune -a`

### GitHub Actions Failed
1. Buka **Actions** tab di repository
2. Klik workflow yang gagal
3. Lihat log error
4. Perbaiki dan push lagi

### Supabase Connection Error
```
Error: Invalid API key
```
**Solusi**:
1. Cek environment variables sudah benar
2. Pastikan menggunakan **anon public key**, bukan service role key

---

## Quick Reference

### Deploy Commands
```bash
# Vercel
vercel --prod

# Docker
docker-compose up -d

# Git push (trigger CI/CD)
git push origin main
```

### Check Status
```bash
# Vercel deployment
vercel list

# Docker containers
docker ps

# GitHub Actions
gh run list
```

---

*Dokumen ini dibuat untuk AlmondSense Platform. Update terakhir: 2026-01-02*
