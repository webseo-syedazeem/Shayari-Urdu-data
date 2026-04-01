# Admin Setup Guide for ShayariUrdu.com

## Overview

The admin panel now uses **Supabase Authentication** for secure access. This ensures that image uploads and CRUD operations are properly authenticated and protected by Row Level Security (RLS) policies.

## Setup Steps

### 1. Create Admin User in Supabase

You need to create an admin user account in your Supabase project:

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **"Add User"** → **"Create new user"**
5. Enter:
   - **Email**: `admin@shayariurdu.com` (or your preferred email)
   - **Password**: Create a strong password
   - Leave **"Auto Confirm User"** checked
6. Click **"Create user"**

**Option B: Via SQL**
```sql
-- Create admin user (adjust email and password as needed)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@shayariurdu.com',
  crypt('YOUR_SECURE_PASSWORD', gen_salt('bf')),
  NOW(),
  '',
  '',
  NOW(),
  NOW()
);
```

### 2. Login to Admin Panel

1. Navigate to your site: `https://your-site.com/#admin-login`
2. Enter the email and password you created above
3. Click **"Login"**
4. You'll be redirected to the admin dashboard

### 3. What Changed

**Before:**
- Admin login was a simple username/password check (hardcoded)
- No actual authentication with Supabase
- Uploads failed with RLS errors

**After:**
- Real Supabase Auth integration
- Admin users are authenticated via Supabase Auth
- All upload and CRUD operations use authenticated sessions
- Storage RLS policies protect uploads (authenticated users only)

### 4. Security Features

The following RLS policies are now active:

**Storage Policies (media bucket):**
- **INSERT**: Only authenticated users can upload
- **UPDATE**: Only authenticated users can update files
- **DELETE**: Only authenticated users can delete files
- **SELECT**: Public read access (for displaying images on frontend)

**Database Policies:**
- All CRUD operations require authentication
- Tables have proper RLS policies for authenticated users

### 5. Admin Features

Once logged in, you can:
- **Upload images** for:
  - Poet avatars
  - Shayari featured images
  - Ebook covers
  - Collection covers
- **Manage content** (Create, Read, Update, Delete):
  - Poets
  - Shayari
  - Ebooks
  - Collections
  - Topics
  - Dictionary words
  - Ad slots

### 6. Troubleshooting

**Problem: "Upload failed: new row violates row-level security policy"**
- **Solution**: Make sure you're logged in with a Supabase Auth account
- Check that storage RLS policies are applied (see migration file)

**Problem: "Please login to admin to upload images"**
- **Solution**: Your session expired or you're not logged in
- Go to `/#admin-login` and login again

**Problem: "Invalid login credentials"**
- **Solution**: Verify email/password in Supabase Dashboard → Authentication → Users
- Reset password if needed via Supabase Dashboard

**Problem: Session expires too quickly**
- **Solution**: Session is managed by Supabase Auth (default: 1 hour)
- Simply login again when prompted

### 7. Logout

To logout:
1. Click the **"Logout"** button in the admin dashboard
2. This will:
   - Sign out from Supabase Auth
   - Clear local session
   - Redirect to homepage

### 8. Important Notes

- **Never share admin credentials**
- **Use a strong password** (minimum 8 characters)
- **Keep your Supabase project secure**
- Admin uploads are restricted to:
  - File types: JPG, PNG, WEBP
  - Max size: 5 MB
  - Organized by entity type in storage

### 9. Default Credentials

**DO NOT USE IN PRODUCTION:**
For development/testing only, create a test admin:
- Email: `admin@shayariurdu.com`
- Password: `AdminPassword123!`

**Change these immediately in production!**

## Summary

Your admin panel now uses proper authentication. All image uploads and CRUD operations are secured with Supabase Auth and RLS policies. Create your admin user in Supabase Dashboard and login to start managing content.
