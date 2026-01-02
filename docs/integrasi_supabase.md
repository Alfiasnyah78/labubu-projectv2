# Panduan Integrasi Supabase untuk AlmondSense

## Daftar Isi
1. [Prasyarat](#prasyarat)
2. [Membuat Project Supabase](#membuat-project-supabase)
3. [Konfigurasi Database](#konfigurasi-database)
4. [Setup Environment Variables](#setup-environment-variables)
5. [Konfigurasi Authentication](#konfigurasi-authentication)
6. [Row Level Security (RLS)](#row-level-security-rls)
7. [Testing Koneksi](#testing-koneksi)
8. [Troubleshooting](#troubleshooting)

---

## Prasyarat

Sebelum memulai, pastikan Anda memiliki:
- Akun [Supabase](https://supabase.com) (gratis)
- Node.js versi 18 atau lebih tinggi
- Git terinstall di komputer Anda
- Repository AlmondSense sudah di-clone

---

## Membuat Project Supabase

### Langkah 1: Daftar atau Login ke Supabase
1. Buka [https://supabase.com](https://supabase.com)
2. Klik **Start your project** atau **Sign In**
3. Anda bisa mendaftar menggunakan GitHub, GitLab, atau email

### Langkah 2: Buat Project Baru
1. Setelah login, klik **New Project**
2. Pilih organisasi (atau buat baru jika belum ada)
3. Isi detail project:
   - **Name**: `almondsense` (atau nama pilihan Anda)
   - **Database Password**: Buat password yang kuat (simpan dengan aman!)
   - **Region**: Pilih region terdekat (contoh: Singapore untuk Indonesia)
4. Klik **Create new project**
5. Tunggu beberapa menit sampai project selesai dibuat

### Langkah 3: Dapatkan API Keys
1. Buka **Settings** → **API**
2. Catat informasi berikut:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Key yang dimulai dengan `eyJ...`
   - **service_role key**: Key rahasia (JANGAN share ke publik!)

---

## Konfigurasi Database

### Langkah 1: Buat Tabel `form_submissions`

Buka **SQL Editor** di dashboard Supabase, lalu jalankan:

```sql
-- Buat enum untuk status submission
CREATE TYPE public.submission_status AS ENUM ('pending', 'negosiasi', 'success');

-- Buat tabel form_submissions
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

-- Enable RLS
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Siapa saja bisa submit form
CREATE POLICY "Anyone can submit a form" 
ON public.form_submissions 
FOR INSERT 
WITH CHECK (true);

-- Policy: Admin bisa membaca semua data
CREATE POLICY "Allow read for admin dashboard" 
ON public.form_submissions 
FOR SELECT 
USING (true);

-- Policy: Admin bisa update
CREATE POLICY "Allow update for admin" 
ON public.form_submissions 
FOR UPDATE 
USING (true);

-- Policy: Admin bisa delete
CREATE POLICY "Allow delete for admin" 
ON public.form_submissions 
FOR DELETE 
USING (true);
```

### Langkah 2: Buat Tabel `profiles`

```sql
-- Buat tabel profiles untuk data user
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: User bisa lihat profile sendiri
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: User bisa insert profile sendiri
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: User bisa update profile sendiri
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);
```

### Langkah 3: Buat Tabel `user_roles`

```sql
-- Buat enum untuk role
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

-- Buat tabel user_roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Function untuk cek role (security definer untuk hindari recursive RLS)
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

-- Policy: User bisa lihat role sendiri
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Admin bisa manage semua roles
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));
```

### Langkah 4: Buat Trigger untuk User Baru

```sql
-- Function untuk handle user baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, company)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'company', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

-- Trigger saat user baru dibuat
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Setup Environment Variables

### Untuk Development Lokal

Buat file `.env` di root project:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Untuk Vercel Production

1. Buka dashboard Vercel project Anda
2. Pergi ke **Settings** → **Environment Variables**
3. Tambahkan:
   - `VITE_SUPABASE_URL` = URL project Supabase Anda
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = anon public key

### Untuk GitHub Actions (CI/CD)

1. Buka repository GitHub Anda
2. Pergi ke **Settings** → **Secrets and variables** → **Actions**
3. Tambahkan secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## Konfigurasi Authentication

### Langkah 1: Aktifkan Email Auth
1. Di dashboard Supabase, buka **Authentication** → **Providers**
2. Pastikan **Email** sudah enabled
3. Untuk testing, disable **Confirm email** di **Auth** → **Settings**

### Langkah 2: Konfigurasi Redirect URLs
1. Buka **Authentication** → **URL Configuration**
2. Set **Site URL**: URL production Anda (contoh: `https://almondsense.vercel.app`)
3. Tambahkan **Redirect URLs**:
   - `http://localhost:5173/**` (untuk development)
   - `https://almondsense.vercel.app/**` (untuk production)
   - URL preview Lovable jika digunakan

---

## Row Level Security (RLS)

### Mengapa RLS Penting?
RLS memastikan data hanya bisa diakses oleh user yang berhak. Tanpa RLS, siapa saja bisa mengakses semua data!

### Tips Keamanan
1. **Selalu enable RLS** pada semua tabel
2. **Gunakan `auth.uid()`** untuk memvalidasi user
3. **Buat function `has_role`** untuk cek role admin
4. **Test policies** sebelum production

---

## Testing Koneksi

### Test dari Browser Console

```javascript
// Buka browser console di aplikasi Anda
const { data, error } = await supabase.from('form_submissions').select('*');
console.log({ data, error });
```

### Test Sign Up

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'testpassword123',
  options: {
    data: {
      full_name: 'Test User',
      phone: '08123456789',
      company: 'Test Company'
    }
  }
});
```

---

## Troubleshooting

### Error: "Invalid API key"
- Pastikan `VITE_SUPABASE_PUBLISHABLE_KEY` benar
- Cek apakah key sudah di-set di environment variables

### Error: "new row violates row-level security policy"
- Pastikan user sudah login untuk operasi yang membutuhkan auth
- Cek apakah policy RLS sudah benar

### Error: "relation does not exist"
- Pastikan tabel sudah dibuat dengan SQL di atas
- Cek nama tabel apakah sudah benar (case-sensitive)

### Data tidak muncul di dashboard
- Cek RLS policies apakah mengizinkan SELECT
- Cek di **Table Editor** apakah data ada

### User baru tidak masuk ke profiles
- Pastikan trigger `on_auth_user_created` sudah dibuat
- Cek di **Database** → **Triggers**

---

## Referensi

- [Dokumentasi Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Authentication Guide](https://supabase.com/docs/guides/auth)

---

*Dokumen ini dibuat untuk AlmondSense Platform. Update terakhir: 2026-01-02*
