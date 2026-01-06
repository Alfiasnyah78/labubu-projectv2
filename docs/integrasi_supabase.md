# Panduan Lengkap Integrasi Supabase untuk AlmondSense

## Daftar Isi
1. [Prasyarat](#prasyarat)
2. [Membuat Project Supabase](#membuat-project-supabase)
3. [Konfigurasi Database](#konfigurasi-database)
4. [Setup Environment Variables](#setup-environment-variables)
5. [Konfigurasi Authentication](#konfigurasi-authentication)
6. [Konfigurasi Email Server (SMTP)](#konfigurasi-email-server-smtp)
7. [Row Level Security (RLS)](#row-level-security-rls)
8. [Testing Koneksi](#testing-koneksi)
9. [Troubleshooting](#troubleshooting)
10. [Referensi](#referensi)

---

## Prasyarat

Sebelum memulai, pastikan Anda memiliki:
- Akun [Supabase](https://supabase.com) (gratis)
- Node.js versi 18 atau lebih tinggi
- Git terinstall di komputer Anda
- Repository AlmondSense sudah di-clone
- (Opsional) Akun email SMTP provider (Gmail, Resend, SendGrid, dll)

---

## Membuat Project Supabase

### Langkah 1: Daftar atau Login ke Supabase

1. Buka browser dan akses [https://supabase.com](https://supabase.com)
2. Klik tombol **Start your project** (hijau) di pojok kanan atas
3. Pilih metode login:
   - **Continue with GitHub** (recommended) - Gunakan akun GitHub Anda
   - **Continue with GitLab** - Gunakan akun GitLab
   - **Sign up with email** - Daftar dengan email manual
4. Jika menggunakan email, verifikasi email Anda terlebih dahulu

### Langkah 2: Buat Organisasi (Jika Belum Ada)

1. Setelah login pertama kali, Anda akan diminta membuat organisasi
2. Klik **New Organization**
3. Isi detail:
   - **Organization name**: `AlmondSense Team` (atau nama tim Anda)
   - **Type**: Personal atau Team
4. Klik **Create organization**

### Langkah 3: Buat Project Baru

1. Di dashboard, klik tombol **New Project** (hijau)
2. Pilih organisasi yang sudah dibuat
3. Isi detail project dengan teliti:

   ```
   Name: almondsense-production
   Database Password: [Buat password yang SANGAT kuat]
   Region: Southeast Asia (Singapore) - ap-southeast-1
   ```

   > ⚠️ **PENTING**: Simpan Database Password di tempat aman! Password ini diperlukan untuk koneksi langsung ke database.

4. Klik **Create new project**
5. Tunggu 2-3 menit sampai project selesai di-setup (status berubah dari "Setting up" ke "Active")

### Langkah 4: Dapatkan API Keys

1. Setelah project aktif, buka **Settings** (ikon gear) di sidebar kiri
2. Klik **API** di submenu
3. Di halaman ini, Anda akan menemukan:

   | Key | Deskripsi | Kegunaan |
   |-----|-----------|----------|
   | **Project URL** | `https://xxxxx.supabase.co` | URL untuk koneksi ke Supabase |
   | **anon public** | `eyJhbGciOiJIUzI1...` | Key untuk client-side (aman di-expose) |
   | **service_role** | `eyJhbGciOiJIUzI1...` | Key untuk server-side (RAHASIA!) |

4. Klik tombol **Copy** untuk menyalin masing-masing key

   > ⚠️ **PERINGATAN KEAMANAN**: 
   > - `anon public` key aman digunakan di frontend
   > - `service_role` key HANYA untuk backend/server, JANGAN pernah expose di frontend!

### Langkah 5: Catat Informasi Project

Buat file catatan (misalnya `supabase-credentials.txt` - JANGAN commit ke Git!) dengan format:

```
=== SUPABASE PROJECT INFO ===
Project Name: almondsense-production
Project ID: xxxxx (lihat di URL: supabase.com/dashboard/project/xxxxx)
Region: ap-southeast-1

=== API KEYS ===
Project URL: https://xxxxx.supabase.co
Anon Public Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

=== DATABASE ===
Database Password: [password Anda]
Connection String: postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres
```

---

## Konfigurasi Database

### Langkah 1: Buka SQL Editor

1. Di sidebar kiri, klik **SQL Editor**
2. Klik **New query** untuk membuat query baru
3. Anda akan melihat editor SQL yang kosong

### Langkah 2: Buat Enum dan Tabel Utama

Copy dan paste SQL berikut, lalu klik **Run** (atau tekan Ctrl/Cmd + Enter):

```sql
-- =============================================
-- STEP 1: Buat ENUM types
-- =============================================

-- Enum untuk status submission form
CREATE TYPE public.submission_status AS ENUM ('pending', 'negosiasi', 'success');

-- Enum untuk role user
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

-- =============================================
-- STEP 2: Buat tabel form_submissions
-- =============================================

CREATE TABLE public.form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT,
  service TEXT NOT NULL,
  land_size TEXT,
  message TEXT,
  status submission_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tambahkan komentar untuk dokumentasi
COMMENT ON TABLE public.form_submissions IS 'Tabel untuk menyimpan data form kontak/konsultasi';
COMMENT ON COLUMN public.form_submissions.status IS 'Status: pending (baru), negosiasi (dalam proses), success (selesai)';

-- =============================================
-- STEP 3: Buat tabel profiles
-- =============================================

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Tabel untuk menyimpan profil user tambahan';

-- =============================================
-- STEP 4: Buat tabel user_roles
-- =============================================

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

COMMENT ON TABLE public.user_roles IS 'Tabel untuk menyimpan role user (admin/customer)';
```

### Langkah 3: Buat Function Helper

Jalankan SQL berikut untuk membuat function yang diperlukan:

```sql
-- =============================================
-- Function: has_role
-- Mengecek apakah user memiliki role tertentu
-- Menggunakan SECURITY DEFINER untuk bypass RLS
-- =============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

COMMENT ON FUNCTION public.has_role IS 'Mengecek apakah user memiliki role tertentu. Digunakan di RLS policies.';

-- =============================================
-- Function: handle_new_user
-- Otomatis membuat profile dan role saat user baru signup
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert ke profiles dengan data dari metadata
  INSERT INTO public.profiles (user_id, full_name, phone, company)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'company', '')
  );
  
  -- Set default role sebagai customer
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS 'Trigger function: membuat profile dan role saat user baru register';

-- =============================================
-- Function: update_updated_at_column
-- Otomatis update timestamp updated_at
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

### Langkah 4: Buat Triggers

```sql
-- =============================================
-- Trigger: Auto-create profile saat user signup
-- =============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Trigger: Auto-update updated_at pada profiles
-- =============================================

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### Langkah 5: Enable RLS dan Buat Policies

```sql
-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLICIES: form_submissions
-- =============================================

-- Siapa saja bisa submit form (tanpa login)
CREATE POLICY "Anyone can submit a form" 
ON public.form_submissions 
FOR INSERT 
WITH CHECK (true);

-- Admin bisa melihat semua submission
CREATE POLICY "Allow read for admin dashboard" 
ON public.form_submissions 
FOR SELECT 
USING (true);

-- Admin bisa update status submission
CREATE POLICY "Allow update for admin" 
ON public.form_submissions 
FOR UPDATE 
USING (true);

-- Admin bisa delete submission
CREATE POLICY "Allow delete for admin" 
ON public.form_submissions 
FOR DELETE 
USING (true);

-- =============================================
-- POLICIES: profiles
-- =============================================

-- User bisa lihat profile sendiri
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- User bisa insert profile sendiri
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- User bisa update profile sendiri
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Admin bisa lihat semua profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Admin bisa update semua profiles
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- Admin bisa delete profiles
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- POLICIES: user_roles
-- =============================================

-- User bisa lihat role sendiri
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admin bisa manage semua roles
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));
```

### Langkah 6: Buat Admin User Pertama

Setelah register user pertama melalui aplikasi, jalankan SQL berikut untuk menjadikannya admin:

```sql
-- Ganti 'email@example.com' dengan email user yang ingin dijadikan admin
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'email@example.com'
);

-- Atau jika ingin menambahkan role admin (user bisa punya multiple roles):
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

### Langkah 7: Verifikasi Struktur Database

Jalankan query berikut untuk memverifikasi semua tabel sudah dibuat dengan benar:

```sql
-- Cek tabel
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Cek policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Cek triggers
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' OR event_object_schema = 'auth';

-- Cek functions
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```

---

## Setup Environment Variables

### Untuk Development Lokal

1. Di root folder project, buat file `.env`:

```bash
# Buat file .env
touch .env
```

2. Edit file `.env` dengan isi berikut:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Project ID (untuk debugging)
VITE_SUPABASE_PROJECT_ID=xxxxx
```

3. Pastikan `.env` sudah ada di `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.*.local
```

### Untuk Vercel Production

1. Login ke [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project AlmondSense
3. Buka **Settings** → **Environment Variables**
4. Tambahkan variable satu per satu:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGci...` | Production, Preview, Development |

5. Klik **Save** untuk setiap variable
6. **Redeploy** project agar variable aktif

### Untuk GitHub Actions (CI/CD)

1. Buka repository di GitHub
2. Pergi ke **Settings** → **Secrets and variables** → **Actions**
3. Klik **New repository secret**
4. Tambahkan secrets:

   | Name | Secret Value |
   |------|--------------|
   | `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon public key |
   | `VERCEL_TOKEN` | Token dari Vercel (untuk deploy) |
   | `VERCEL_ORG_ID` | Organization ID Vercel |
   | `VERCEL_PROJECT_ID` | Project ID Vercel |

---

## Konfigurasi Authentication

### Langkah 1: Aktifkan Email Authentication

1. Di dashboard Supabase, buka **Authentication** di sidebar
2. Klik **Providers** di submenu
3. Cari **Email** dan pastikan sudah **Enabled**
4. Konfigurasi opsi:
   - **Confirm email**: OFF (untuk development), ON (untuk production)
   - **Secure email change**: ON
   - **Secure password change**: ON

### Langkah 2: Konfigurasi URL

1. Masih di **Authentication**, klik **URL Configuration**
2. Set konfigurasi berikut:

   | Setting | Value |
   |---------|-------|
   | **Site URL** | `https://almondsense.vercel.app` (URL production) |
   | **Redirect URLs** | Lihat di bawah |

3. Tambahkan Redirect URLs (klik **Add URL** untuk setiap entry):
   ```
   http://localhost:5173/**
   http://localhost:5173
   https://almondsense.vercel.app/**
   https://almondsense.vercel.app
   https://*.lovableproject.com/**
   ```

### Langkah 3: Konfigurasi Email Templates (Opsional)

1. Buka **Authentication** → **Email Templates**
2. Anda bisa customize template untuk:
   - **Confirm signup** - Email konfirmasi pendaftaran
   - **Invite user** - Email undangan user
   - **Magic Link** - Email login tanpa password
   - **Change Email Address** - Email verifikasi perubahan email
   - **Reset Password** - Email reset password

3. Contoh template custom untuk Confirm Signup:

```html
<h2>Selamat Datang di AlmondSense!</h2>
<p>Halo {{ .Email }},</p>
<p>Terima kasih telah mendaftar di AlmondSense. Klik tombol di bawah untuk konfirmasi email Anda:</p>
<p>
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #166534; color: white; padding: 12px 24px; 
            text-decoration: none; border-radius: 6px; display: inline-block;">
    Konfirmasi Email
  </a>
</p>
<p>Atau copy link berikut ke browser Anda:</p>
<p>{{ .ConfirmationURL }}</p>
<p>Link ini akan expired dalam 24 jam.</p>
<br>
<p>Salam,<br>Tim AlmondSense</p>
```

---

## Konfigurasi Email Server (SMTP)

Supabase secara default menggunakan email server bawaan dengan limit 4 email/jam. Untuk production, Anda perlu menggunakan SMTP server sendiri.

### Opsi 1: Menggunakan Resend (Recommended)

[Resend](https://resend.com) adalah layanan email modern yang mudah diintegrasikan.

#### Step 1: Daftar Akun Resend

1. Buka [https://resend.com](https://resend.com)
2. Klik **Get Started** dan daftar dengan GitHub/Google
3. Verifikasi email Anda

#### Step 2: Setup Domain

1. Di dashboard Resend, buka **Domains**
2. Klik **Add Domain**
3. Masukkan domain Anda (contoh: `almondsense.com`)
4. Ikuti instruksi untuk menambahkan DNS records:

   | Type | Name | Value |
   |------|------|-------|
   | TXT | resend._domainkey | `p=MIGfMA0G...` |
   | TXT | @ atau domain | `v=spf1 include:_spf.resend.com ~all` |

5. Tunggu verifikasi (biasanya 5-30 menit)

#### Step 3: Dapatkan API Key

1. Buka **API Keys** di Resend dashboard
2. Klik **Create API Key**
3. Beri nama: `almondsense-production`
4. Pilih permission: **Full access** atau **Sending access**
5. Copy API key yang ditampilkan (hanya muncul sekali!)

#### Step 4: Konfigurasi di Supabase

1. Di dashboard Supabase, buka **Project Settings** → **Authentication**
2. Scroll ke bagian **SMTP Settings**
3. Klik **Enable Custom SMTP**
4. Isi dengan konfigurasi berikut:

   | Setting | Value |
   |---------|-------|
   | **Sender email** | `noreply@almondsense.com` |
   | **Sender name** | `AlmondSense` |
   | **Host** | `smtp.resend.com` |
   | **Port** | `465` |
   | **Username** | `resend` |
   | **Password** | `re_xxxxx...` (API key Resend) |

5. Klik **Save**

### Opsi 2: Menggunakan Gmail SMTP

> ⚠️ **Catatan**: Gmail memiliki limit 500 email/hari. Hanya untuk testing atau traffic rendah.

#### Step 1: Aktifkan 2-Step Verification

1. Buka [Google Account Security](https://myaccount.google.com/security)
2. Aktifkan **2-Step Verification** jika belum

#### Step 2: Buat App Password

1. Masih di Security settings
2. Cari **App passwords** (di bagian "Signing in to Google")
3. Klik **App passwords**
4. Pilih app: **Mail**
5. Pilih device: **Other (Custom name)** → masukkan `AlmondSense Supabase`
6. Klik **Generate**
7. Copy password 16 karakter yang ditampilkan

#### Step 3: Konfigurasi di Supabase

| Setting | Value |
|---------|-------|
| **Sender email** | `youremail@gmail.com` |
| **Sender name** | `AlmondSense` |
| **Host** | `smtp.gmail.com` |
| **Port** | `465` |
| **Username** | `youremail@gmail.com` |
| **Password** | `xxxx xxxx xxxx xxxx` (App Password) |

### Opsi 3: Menggunakan SendGrid

#### Step 1: Daftar SendGrid

1. Buka [https://sendgrid.com](https://sendgrid.com)
2. Daftar akun gratis (100 email/hari gratis)

#### Step 2: Verifikasi Sender

1. Di dashboard SendGrid, buka **Settings** → **Sender Authentication**
2. Pilih **Single Sender Verification** atau **Domain Authentication**
3. Ikuti langkah verifikasi

#### Step 3: Dapatkan API Key

1. Buka **Settings** → **API Keys**
2. Klik **Create API Key**
3. Pilih **Restricted Access**
4. Enable: **Mail Send** → **Full Access**
5. Copy API key

#### Step 4: Konfigurasi di Supabase

| Setting | Value |
|---------|-------|
| **Sender email** | `noreply@almondsense.com` |
| **Sender name** | `AlmondSense` |
| **Host** | `smtp.sendgrid.net` |
| **Port** | `465` |
| **Username** | `apikey` (literal string) |
| **Password** | `SG.xxxxx...` (API key SendGrid) |

### Opsi 4: Menggunakan AWS SES

#### Step 1: Setup AWS SES

1. Login ke [AWS Console](https://console.aws.amazon.com)
2. Buka **Amazon SES** service
3. Verifikasi domain atau email di **Verified identities**

#### Step 2: Dapatkan SMTP Credentials

1. Di SES, buka **SMTP settings**
2. Klik **Create SMTP credentials**
3. Catat **SMTP Username** dan **SMTP Password**

#### Step 3: Konfigurasi di Supabase

| Setting | Value |
|---------|-------|
| **Sender email** | `noreply@almondsense.com` |
| **Sender name** | `AlmondSense` |
| **Host** | `email-smtp.ap-southeast-1.amazonaws.com` |
| **Port** | `465` |
| **Username** | `AKIA...` (SMTP Username) |
| **Password** | `...` (SMTP Password) |

### Testing Email Configuration

1. Setelah mengkonfigurasi SMTP, test dengan:
   - Register user baru
   - Request password reset
   - Change email

2. Cek di dashboard Supabase **Authentication** → **Users** untuk melihat log email

3. Jika email tidak terkirim, cek:
   - Kredensial SMTP benar
   - Port tidak diblokir
   - Domain sudah terverifikasi
   - Cek spam folder

### Perbandingan Email Providers

| Provider | Free Tier | Best For | Pros | Cons |
|----------|-----------|----------|------|------|
| **Resend** | 100/hari | Startups, Modern apps | Simple API, Good DX | Newer service |
| **SendGrid** | 100/hari | Enterprise | Reliable, Analytics | Complex setup |
| **Gmail** | 500/hari | Testing | Free, Easy setup | Low limits |
| **AWS SES** | 62,000/bulan (dengan EC2) | High volume | Very cheap, Scalable | Complex setup |
| **Mailgun** | 5,000/3 bulan | Developers | Good API, Logs | Limited free tier |

---

## Row Level Security (RLS)

### Mengapa RLS Penting?

Row Level Security memastikan data hanya bisa diakses oleh user yang berhak. Tanpa RLS, siapa saja dengan API key bisa mengakses semua data!

### Konsep Dasar

```sql
-- Setiap SELECT/INSERT/UPDATE/DELETE di-filter oleh policy
-- Contoh: User hanya bisa lihat data mereka sendiri
CREATE POLICY "Users can view own data" 
ON my_table
FOR SELECT
USING (auth.uid() = user_id);
```

### Best Practices

1. **Selalu enable RLS** pada semua tabel user data
2. **Gunakan `auth.uid()`** untuk validasi user yang login
3. **Buat function `has_role`** untuk cek admin (hindari recursive RLS)
4. **Test policies** dengan query langsung sebelum production
5. **Jangan gunakan `USING (true)`** kecuali untuk data publik

### Debug RLS Issues

```sql
-- Cek policies yang aktif
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Test policy dengan role tertentu
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM your_table; -- Akan di-filter oleh RLS
RESET ROLE;
```

---

## Testing Koneksi

### Test 1: Koneksi Dasar

Buka browser console di aplikasi dan jalankan:

```javascript
// Test koneksi ke Supabase
import { supabase } from '@/integrations/supabase/client';

const testConnection = async () => {
  const { data, error } = await supabase.from('form_submissions').select('count');
  console.log('Connection test:', { data, error });
};

testConnection();
```

### Test 2: Sign Up Flow

```javascript
const testSignUp = async () => {
  const { data, error } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'SecurePass123!',
    options: {
      data: {
        full_name: 'Test User',
        phone: '08123456789',
        company: 'Test Company'
      }
    }
  });
  
  console.log('Sign up result:', { data, error });
};
```

### Test 3: RLS Check

```javascript
// Sebelum login - harusnya dapat data kosong atau error
const { data: before } = await supabase.from('profiles').select('*');
console.log('Before login:', before); // Should be empty/error

// Setelah login
await supabase.auth.signIn({ email: '...', password: '...' });
const { data: after } = await supabase.from('profiles').select('*');
console.log('After login:', after); // Should see own profile
```

---

## Troubleshooting

### Error: "Invalid API key"
- ✅ Pastikan `VITE_SUPABASE_PUBLISHABLE_KEY` benar (bukan service_role key)
- ✅ Cek apakah key sudah di-set di environment variables
- ✅ Restart development server setelah mengubah .env

### Error: "new row violates row-level security policy"
- ✅ Pastikan user sudah login untuk operasi yang membutuhkan auth
- ✅ Cek apakah policy RLS sudah benar dengan `SELECT * FROM pg_policies`
- ✅ Pastikan `auth.uid()` tidak null

### Error: "relation does not exist"
- ✅ Pastikan tabel sudah dibuat dengan SQL di atas
- ✅ Cek nama tabel (case-sensitive di PostgreSQL)
- ✅ Pastikan menggunakan schema `public`

### Data tidak muncul di dashboard
- ✅ Cek RLS policies apakah mengizinkan SELECT
- ✅ Cek di **Table Editor** apakah data ada
- ✅ Pastikan user yang login punya akses

### User baru tidak masuk ke profiles
- ✅ Pastikan trigger `on_auth_user_created` sudah dibuat
- ✅ Cek di **Database** → **Triggers**
- ✅ Cek log error di **Database** → **Logs**

### Email tidak terkirim
- ✅ Cek konfigurasi SMTP sudah benar
- ✅ Verifikasi domain sudah selesai
- ✅ Cek spam folder penerima
- ✅ Lihat log di **Authentication** → **Logs**

### Error: "Email rate limit exceeded"
- ✅ Default Supabase limit 4 email/jam
- ✅ Setup custom SMTP untuk limit lebih tinggi
- ✅ Tunggu 1 jam jika menggunakan default

---

## Referensi

### Dokumentasi Resmi
- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Authentication Guide](https://supabase.com/docs/guides/auth)
- [SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)

### Email Providers
- [Resend Documentation](https://resend.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses)

### Tools
- [Supabase CLI](https://supabase.com/docs/reference/cli)
- [Supabase Studio](https://supabase.com/docs/guides/studio)

---

*Dokumen ini dibuat untuk AlmondSense Platform.*
*Terakhir diperbarui: 2026-01-06*
*Versi: 2.0*
